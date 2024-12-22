import { wrapCloudflareHandler } from "sst";

const { default: astro } = await import("./dist/_worker.js/index.js");
// The "sst" package should be marked as external in esbuild!
export default wrapCloudflareHandler(astro);
