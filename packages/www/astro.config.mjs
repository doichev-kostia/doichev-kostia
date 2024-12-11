import { defineConfig, sharpImageService } from "astro/config";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
import sitemap from "@astrojs/sitemap";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
	site: "https://doichevkostia.dev",

	image: {
		service: sharpImageService(),
	},

	server: {
		host: "0.0.0.0",
	},

	markdown: {
		shikiConfig: {
			theme: {
				light: "rose-pine",
			},
		},
	},
	vite: {
		ssr: {
			external: [
				"node:assert",
				"node:async_hooks",
				"node:buffer",
				"node:child_process",
				"node:cluster",
				"node:console",
				"node:constants",
				"node:crypto",
				"node:dgram",
				"node:diagnostics_channel",
				"node:dns",
				"node:domain",
				"node:events",
				"node:fs",
				"node:fs/promises",
				"node:http",
				"node:http2",
				"node:https",
				"node:inspector",
				"node:module",
				"node:net",
				"node:os",
				"node:path",
				"node:perf_hooks",
				"node:process",
				"node:punycode",
				"node:querystring",
				"node:readline",
				"node:repl",
				"node:stream",
				"node:string_decoder",
				"node:sys",
				"node:timers",
				"node:timers/promises",
				"node:tls",
				"node:trace_events",
				"node:tty",
				"node:url",
				"node:util",
				"node:v8",
				"node:vm",
				"node:wasi",
				"node:worker_threads",
				"node:zlib",
				"assert",
				"async_hooks",
				"buffer",
				"child_process",
				"cluster",
				"console",
				"constants",
				"crypto",
				"dgram",
				"diagnostics_channel",
				"dns",
				"domain",
				"events",
				"fs",
				"fs/promises",
				"http",
				"http2",
				"https",
				"inspector",
				"module",
				"net",
				"os",
				"path",
				"perf_hooks",
				"process",
				"punycode",
				"querystring",
				"readline",
				"repl",
				"stream",
				"string_decoder",
				"sys",
				"timers",
				"timers/promises",
				"tls",
				"trace_events",
				"tty",
				"url",
				"util",
				"v8",
				"vm",
				"wasi",
				"worker_threads",
				"zlib",
			],
		},
	},

	integrations: [tailwind(), sitemap()],
	output: "server",
	adapter: cloudflare({
		imageService: "compile",
		platformProxy: {
			enabled: true,
		},
	}),
});
