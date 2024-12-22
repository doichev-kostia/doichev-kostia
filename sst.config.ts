/// <reference path="./.sst/platform/config.d.ts" />
import { ZodSchema } from "zod";
import { z } from "zod";
import { WorkerConfig } from "./infra/cf";

const env = z
	.object({
		CLOUDFLARE_DEFAULT_ACCOUNT_ID: z.string().min(1),
		CLOUDFLARE_API_TOKEN: z
			.string()
			.min(1)
			.describe("https://dash.cloudflare.com/profile/api-tokens/"),
		GITHUB_TOKEN: z
			.string()
			.min(1)
			.describe(
				"A GitHub OAuth / Personal Access Token - https://github.com/settings/tokens |  gh auth token",
			),
	})
	.parse(process.env);
export default $config({
	app(input) {
		return {
			name: "doichev-kostia",
			removal: input?.stage === "production" ? "retain" : "remove",
			home: "cloudflare",
			providers: {
				cloudflare: {
					apiToken: env.CLOUDFLARE_API_TOKEN,
				},
				github: {
					version: "6.4.0",
					owner: "doichev-kostia",
					token: env.GITHUB_TOKEN,
				},
				random: {
					version: "4.16.8",
				},
				command: { version: "1.0.1" },
			},
		};
	},
	async run() {
		const domains = {
			production: "doichevkostia.dev",
			dev: "dev.doichevkostia.dev",
		};
		const domain =
			domains[$app.stage as keyof typeof domains] ||
			$app.stage + ".dev.doichevkostia.dev";
		const r2 = new sst.cloudflare.Bucket("Bucket");
		const secrets = {
			GoogleOauthClientID: new sst.Secret("GoogleOauthClientID"),
			GoogleOauthClientSecret: new sst.Secret("GoogleOauthClientSecret"),
		} as const;
		const authKv = new sst.cloudflare.Kv("AuthKv");
		const auth = new sst.cloudflare.Worker("AuthWorker", {
			handler: "./packages/workers/src/auth/main.ts",
			url: true,
			link: [
				authKv,
				secrets.GoogleOauthClientID,
				secrets.GoogleOauthClientSecret,
			],
		});
		sst.Linkable.wrap(random.RandomPassword, (resource) => {
			return {
				properties: {
					value: resource.result,
				},
			};
		});
		const knowledeBaseSyncSecret = new random.RandomPassword(
			"KnowledgeBaseWebhookSecret",
			{
				length: 32,
			},
		);
		const knowledgeBaseSync = new github.RepositoryWebhook(
			"KnowledgeBaseSync",
			{
				repository: "knowledge-base",
				active: false,
				configuration: {
					url: `https://${domain}/api/events/github`,
					contentType: "json",
					insecureSsl: false,
					secret: knowledeBaseSyncSecret.result,
				},
				events: ["push"],
			},
		);
		const siteDev = new sst.x.DevCommand("WWWDev", {
			link: [auth, knowledeBaseSyncSecret],
			dev: {
				command: "pnpm --filter=www run dev",
			},
		});
		const workerKnowledgeBaseSecret = new cloudflare.WorkersSecret(
			"WWWKnowledgeBaseSecret",
			{
				accountId: env.CLOUDFLARE_DEFAULT_ACCOUNT_ID,
				name: "KnowledgeBaseWebhookSecret",
				scriptName: "doichev-kostia-dev-wwwscript",
				secretText: knowledeBaseSyncSecret.result,
			},
		);

		const cfg = WorkerConfig({
			name: "test-www",
			handler: "./packages/www/dist/_worker.js/index.js",
			assets: "./packages/www/dist",
			domain: domain,
			link: [auth, knowledeBaseSyncSecret]
		});

		cfg.apply((x) => console.log(x));

		const filename = `www-config-${$app.stage}.toml`

		const createConfig = new command.local.Command("WWWCreateConfig", {
			triggers: [cfg],
			dir: process.cwd(),
			create: $util.interpolate`echo '${cfg}' > ${filename}`
		});

		const wranglerDeploy = new command.local.Command("WWWDeploy", {
			environment: {
				CLOUDFLARE_DEFAULT_ACCOUNT_ID: env.CLOUDFLARE_DEFAULT_ACCOUNT_ID,
				CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN,
			},
			dir: process.cwd(),
			triggers: [cfg],
			create: $util.interpolate`pnpm exec wrangler deploy --config=${filename}`
		}, { dependsOn: [createConfig] });


		// const site = new sst.cloudflare.Worker("WWW", {
		// 	handler: "./packages/www/dist/_worker.js/index.js",
		// 	domain: domain,
		// 	url: true,
		// 	link: [
		// 		auth,
		// 		knowledeBaseSyncSecret,
		// 	],
		// });
		return {
			auth: auth.url,
			// www: site.url,
		};
	},
});
