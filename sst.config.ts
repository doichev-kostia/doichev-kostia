import { match } from "ts-pattern";
import { z } from "zod";

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

		const authService = new sst.Linkable("AuthService", {
			properties: {
				url: auth.url,
			}
		})

		function randomPasswordLink(resource: random.RandomPassword) {
			return {
				properties: {
					value: resource.result,
				},
			};
		}

		sst.Linkable.wrap(random.RandomPassword, randomPasswordLink);

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
			link: [authService, knowledeBaseSyncSecret],
			dev: {
				command: "pnpm --filter=www run dev",
			},
		});

		// Unfortunatelly, very small set of cloudlfare features is supported by terraform, therefore, it's better to use wrangler, and only manage the links in SST
		const wwwWorkerName = match($app.stage)
			.with("production", () => "doichev-kostia-production-www")
			.otherwise(() => "doichev-kostia-dev-www");

		const sstAppSecret = new cloudflare.WorkersSecret("WWWSSTAppSecret", {
			accountId: env.CLOUDFLARE_DEFAULT_ACCOUNT_ID,
			name: "SST_RESOURCE_App",
			scriptName: wwwWorkerName,
			secretText: $util.jsonStringify({
				name: $app.name,
				stage: $app.stage,
			}),
		});

		const authServiceSecret = new cloudflare.WorkersSecret("WWWAuthServiceSecret", {
			accountId: env.CLOUDFLARE_DEFAULT_ACCOUNT_ID,
			name: "AuthService",
			scriptName: wwwWorkerName,
			secretText: $util.jsonStringify(authService.properties)
		});

		const workerKnowledgeBaseSecret = new cloudflare.WorkersSecret(
			"WWWKnowledgeBaseSecret",
			{
				accountId: env.CLOUDFLARE_DEFAULT_ACCOUNT_ID,
				name: "KnowledgeBaseWebhookSecret",
				scriptName: wwwWorkerName,
				secretText: $util.jsonStringify(randomPasswordLink(knowledeBaseSyncSecret).properties),
			},
		);


		return {
			auth: auth.url,
		};
	},
});
