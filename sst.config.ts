/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
	app(input) {
		return {
			name: "doichev-kostia",
			removal: input?.stage === "production" ? "retain" : "remove",
			home: "cloudflare",
			providers: {
				cloudflare: {
					apiToken: process.env.CLOUDFLARE_API_TOKEN,
				},
			},
		};
	},
	async run() {
		const r2 = new sst.cloudflare.Bucket("Dump");


	},
});
