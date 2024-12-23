import { drizzle } from "drizzle-orm/d1";
import { GitHub } from "./core/github";
import { Queue } from "./core/queue";
import { DatabaseContext } from "./db/db";
import { logger, LoggerContext } from "./lib/logger";
import { fmt } from "./lib/fmt";
import { Context } from "./lib/context";

export async function queue(batch: MessageBatch<unknown>, env: CloudflareEnvironment, ctx: ExecutionContext): Promise<void> {
	console.log(batch);
	const consumer = Queue.consumer(
		[GitHub.QueueMessages.import],
		async function queueHandler(batch) {
			logger().info(batch);
			batch.forEach(m => m.ack());
		});

	const wrap = Context.compose(
		LoggerContext.curry(console),
		DatabaseContext.curry(drizzle(env.DB)),
	);

	await wrap(async function () {
		const failed = await consumer(batch, env, ctx);
		if (failed.length > 0) {
			const err = fmt.Errorf("[Queue(%s) Subscriber] %d messages failed to process", batch.queue, failed.length)
			logger().error(err);
			throw err;
		}
		logger().info(fmt.Sprintf("[Queue(%s) Subscriber] processed %d messages", batch.queue, batch.messages.length));
	});
}
