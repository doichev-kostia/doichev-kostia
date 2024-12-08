import { reactRouter } from "@react-router/dev/vite";
import { reactRouterHonoServer } from "react-router-hono-server/dev";
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ isSsrBuild }) => ({
	css: {
		postcss: {
			plugins: [tailwindcss, autoprefixer],
		},
	},
	build: {
		target: "esnext"
	},
	plugins: [
		cloudflareDevProxy(),
		reactRouterHonoServer({ runtime: "cloudflare", serverEntryPoint: "./workers/server.ts" }),
		reactRouter(),
		tsconfigPaths(),
	],
}));
