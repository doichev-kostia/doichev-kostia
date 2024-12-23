type Runtime = import('@astrojs/cloudflare').Runtime<CloudflareEnvironment>;

declare namespace App {
	interface Locals extends Runtime {
	}
}
