import { Schema, z, type ZodSchema } from "zod";
import type { Prettify } from "~/lib/types";
import type { Message as CloudflareMessage, ExecutionContext, Queue as CloudflareQueue } from "@cloudflare/workers-types";
import { Context } from "~/lib/context";

export const QueueContext = Context.create<CloudflareEnvironment["Queue"]>("Queue");

export function queue() {
	return QueueContext.mustUse();
}

export module Queue {
	export const Message = z.object({
		type: z.string(),
		properties: z.unknown().nullish()
	});

	export type MessageDefinition = {
		type: string;
		schema: ZodSchema,
		$payload: any;
		$input: any;
		create: (...args: any[]) => any;
	}

	export function defineMessage<Type extends string, Schema extends ZodSchema>(type: Type, schema: Schema) {
		type Payload = Prettify<{ type: Type, properties: Schema["_output"] }>;
		return {
			type,
			schema,
			create(properties: Schema["_input"]): Payload {
				return {
					type,
					properties: schema.parse(properties),
				}
			},
			// utility for types
			$payload: {} as Payload,
			$input: {} as Schema["_input"],
		} satisfies MessageDefinition;
	}

	type QueueHandler<CloudflareEnv extends Record<string, any> = {}> = (
		batch: MessageBatch,
		env: CloudflareEnv,
		ctx: ExecutionContext,
	) => Promise<Array<CloudflareMessage>>;

	/**
	* @param messageDefinitions - list of messages this handler will process. Everything else - ignored
	* @param cb - callback that will process only valid messages
	* @returns Cloudflare queue handler with messages that did not match the definition
	*/
	export function consumer<Definition extends MessageDefinition, CloudflareEnv extends Record<string, any> = {}, Message = { [K in Definition["type"]]: Extract<Definition, { type: K }>["$payload"] }[Definition["type"]]>(
		messageDefinitions: Array<Definition>,
		cb: (batch: Array<CloudflareMessage<Message>>, env: CloudflareEnv, ctx: ExecutionContext) => Promise<void>
	): QueueHandler<CloudflareEnv> {
		const schemas = new Map<string, ZodSchema>();
		for (const d of messageDefinitions) {
			schemas.set(d.type, d.schema);
		}

		return async function queueSubscriber(batch, env, ctx) {
			const valid: Array<CloudflareMessage<Message>> = [];
			const invalid: Array<CloudflareMessage> = [];

			for (const message of batch.messages) {
				const result = Message.safeParse(message.body);
				if (!result.success) {
					invalid.push(message);
					continue;
				}
				const schema = schemas.get(result.data.type);

				if (!schema || schema.safeParse(message.body).success === false) {
					invalid.push(message);
				} else {
					valid.push(message as CloudflareMessage<Message>);
				}
			}

			await cb(valid, env, ctx);
			return invalid;
		}
	}

	export async function enqueue<Definition extends MessageDefinition>(queue: CloudflareQueue, definition: Definition, properties: Definition["$input"], options?: QueueSendOptions) {
		await queue.send(definition.create(properties), options);
	}
}
