import { wrapCloudflareHandler } from "sst";
import { queue } from "./src/queue.js";

let fetch: ExportedHandlerFetchHandler;
if (process.env.NODE_ENV === "development") {
	fetch = () => new Response("Dev mode. Open `http://localhost:5173` for astro");
} else {
	// @ts-nocheck as there may not be a dist directory
	const { default: astro } = await import("./dist/_worker.js/index.js");
	fetch = astro.fetch;
}

// The "sst" package should be marked as external in esbuild!
export default wrapCloudflareHandler({
	fetch,
	queue,
} satisfies ExportedHandler<CloudflareEnvironment>);
