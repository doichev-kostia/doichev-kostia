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

		const secrets = {
			GoogleOauthClientID: new sst.Secret("GoogleOauthClientID"),
			GoogleOauthClientSecret: new sst.Secret("GoogleOauthClientSecret"),
		} as const;

		const authKv = new sst.cloudflare.Kv("AuthKv");
		const auth = new sst.cloudflare.Worker("Auth", {
			handler: "./packages/workers/src/auth/main.ts",
			url: true,
			link: [
				authKv,
				secrets.GoogleOauthClientID,
				secrets.GoogleOauthClientSecret,
			]
		});

		const astro = new sst.x.DevCommand("WWW", {
			link: [
				auth
			],
			dev: {
				command: "pnpm --filter=www run dev"
			}
		})

		return {
			auth: auth.url,
		}
	},
});
