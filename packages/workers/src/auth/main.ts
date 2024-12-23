import { authorizer } from "@openauthjs/openauth";
import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";
import { GoogleAdapter } from "@openauthjs/openauth/adapter/google";
import { Resource as SstResource } from "sst";
import { assert } from "@std/assert";
import { GoogleApi } from "./google.js";
import { isAdmin, subjects } from "@doichev-kostia/core/actor";
import * as process from "node:process";
import type { Request, Response, ExecutionContext, ExportedHandler, KVNamespace } from "@cloudflare/workers-types";

type Env = {};

function Resource(env: Env) {
	return SstResource;
}

if (process.env.SST_DEV) {
	const dbgr = await import("@doichev-kostia/core/debugger").then(m => new m.Debugger());
	console.log(`PID: ${process.pid}`);
	dbgr.start(9230);
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const auth = authorizer({
			providers: {
				google: GoogleAdapter({
					clientID: Resource(env).GoogleOauthClientID.value,
					clientSecret: Resource(env).GoogleOauthClientSecret.value,
					scopes: ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"],
				}),
			},
			storage: CloudflareStorage({
				// TODO: figure out ts
				namespace: Resource(env).AuthKv as any as KVNamespace
			}),
			subjects: subjects,
			async success(ctx, value) {
				assert(value.provider === "google", "Only google provider is supported");
				const userinfo = await GoogleApi.getUserInfo(value.tokenset.access);

				console.log(userinfo);

				if (!isAdmin(userinfo.sub)) throw new Error("Invalid User");

				return ctx.subject("account", {
					sub: userinfo.sub,
				});
			}
		});

		// @ts-expect-error mismatch between globalThis Request/Response and Cloudflare Request/Response
		return auth.fetch(request, env, ctx);
	}
} satisfies ExportedHandler<Env>;
