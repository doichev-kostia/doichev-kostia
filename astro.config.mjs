import { defineConfig, sharpImageService } from "astro/config";

// https://astro.build/config
import tailwind from "@astrojs/tailwind";


// https://astro.build/config
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
	site: "https://doichevkostia.dev",
	image: {
		service: sharpImageService(),
	},
	markdown: {
		shikiConfig: {
			experimentalThemes: {
				light: "github-light",
			}
		}
	},
	integrations: [tailwind(), sitemap()]
});
