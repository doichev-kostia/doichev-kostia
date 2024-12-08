import { KvContext } from "~/kv";
import { createHonoServer } from "react-router-hono-server/cloudflare";
import { type Context, type Hono } from "hono";
import { type ServerBuild } from "react-router";
import { BucketContext } from "~/bucket";


/* type your Cloudflare bindings here */
type Bindings = CloudflareEnvironment & {};

/* type your Hono variables (used with c.get/c.set) here */
type Variables = {};

type ContextEnv = { Bindings: Bindings; Variables: Variables };

export function getLoadContext(c: Context, options: { build: ServerBuild; mode: string; }) {
	const { build, mode } = options;

	return {
		// Nice to have if you want to display the app version or do something in the app when deploying a new version
		// Exemple: on navigate, check if the app version is the same as the one in the build assets and if not, display a toast to the user to refresh the page
		// Prevent the user to use an old version of the client side code (it is only downloaded on document request)
		appVersion: mode === "production" ? build.assets.version : "dev",
	};
}

declare module "react-router" {
	export interface AppLoadContext extends Awaited<ReturnType<typeof getLoadContext>> {
	}
}

const server = await createHonoServer<ContextEnv>({
	configure(server) {
		let s = server as any as Hono<ContextEnv>; // TODO: figure it out
		s.get("/ping", async c => c.text("pong"));
		s.use("*", async (c, next) => {
			return KvContext.with(c.env.kv, async () => {
				return BucketContext.with(c.env.dump, async () => {
					return await next();
				})
			});
		});
	},
	getLoadContext,
});


export default server;
