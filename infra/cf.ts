interface Definition<
	Properties extends Record<string, any> = Record<string, any>,
> {
	properties: Properties;
	include?: {
		type: string;
		[key: string]: any;
	}[];
}

interface Linkable {
	urn: $util.Output<string>;
	getSSTLink(): Definition;
}

const WorkerConfig = fn(
	z.object({
		name: z.string(),
		handler: z.string().describe("path to cf worker"),
		assets: z.string().describe("path to directory with static assets"),
		domain: z.custom<$util.Input<string>>(),
		link: z.array(z.custom<$util.Input<any>>()),
	}),
	(input) => {
		return $util.all([input.domain, input.link]).apply(([domain, links]) => {
			// todo: use the toml file names for bindings
			const bindings = {
				plainTextBindings: [
					{
						name: "SST_RESOURCE_App",
						text: $util.jsonStringify({
							name: $app.name,
							stage: $app.stage,
						}),
					},
				],
			} as Record<Binding["type"], any[]>;
			for (const l of links) {
				if (!Link.isLinkable(l)) continue;
				const name = $output(l).apply(uri => uri.split("::").at(-1)!);
				const item = l.getSSTLink();

				const cfBinding = item.include?.find(
					(i) => i.type === "cloudflare.binding",
				) as ReturnType<typeof sst.cloudflare.binding>;

				if (cfBinding) {
					if (!bindings[cfBinding.binding]) bindings[cfBinding.binding] = [];
					const binding = toWorkerScriptBinding(name, cfBinding);
					bindings[cfBinding.binding].push(binding);

					continue;
				}
				if (!bindings.secretTextBindings) bindings.secretTextBindings = [];
				bindings.secretTextBindings.push({
					name,
					text: $util.jsonStringify(item.properties),
				});
			}
			// https://developers.cloudflare.com/workers/wrangler/configuration/
			const config = {
				name: input.name,
				main: input.handler,
				compatibility_date: "2024-11-12",
				compatibility_flags: ["nodejs_compat"],
				assets: {
					directory: input.assets,
					binding: "ASSETS",
				},
				routes: [
					{
						pattern: domain,
						custom_domain: true,
					},
				],
				observability: {
					enabled: true,
				},
				vars: {
					foo: "bar",
				},
			};
			return toml.stringify(config);
		});
	},
);
