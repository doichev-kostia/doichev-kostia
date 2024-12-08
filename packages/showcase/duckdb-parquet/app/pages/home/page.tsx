import type { Route } from "./+types/page";
import { queryClient } from "~/query-client";
import { ServerComparison } from "~/core/comparison/server";
import { ClientComparison } from "~/core/comparison/client";
import { Comparison } from "~/core/comparison/comparison";
import { Link } from "react-router";
import { cn } from "~/lib/cn";


export async function loader({ context }: Route.LoaderArgs) {
	const comparisons = await ServerComparison.list();
	return comparisons;
}

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
	let data = queryClient.getQueryData<Array<Comparison.T>>(ClientComparison.listOptions.queryKey);

	if (!data) {
		data = await serverLoader();
		queryClient.setQueryData(ClientComparison.listOptions.queryKey, data);
	}

	return data;
}

clientLoader.hydrate = true as const;

const statuses: Record<Comparison.T["status"], string> = {
	completed: "text-green-700 bg-green-50 ring-green-600/20",
};

export default function HomePage({ loaderData }: Route.ComponentProps) {
	return (
		<section data-page="home">
			<div className="container px-4 mx-auto">
				<div className="max-w-2xl mx-auto">
					<ul role="list" className="divide-y divide-gray-100">
						{loaderData.map((comparison) => (
							<li key={comparison.id} className="flex items-center justify-between gap-x-6 py-5">
								<div className="min-w-0">
									<div className="flex items-start gap-x-3">
										<p className="text-sm/6 font-semibold text-gray-900">{comparison.name}</p>
										<p
											className={cn(
												statuses[comparison.status],
												"mt-0.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset",
											)}
										>
											{comparison.status}
										</p>
									</div>
									<div className="mt-1 flex items-center gap-x-2 text-xs/5 text-gray-500">
										<p className="truncate">Created by John Doe</p>
									</div>
								</div>
								<div className="flex flex-none items-center gap-x-4">
									<Link
										to={`/comparisons/${comparison.id}`}
										className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
										prefetch="intent"
									>
										View <span className="sr-only">, {comparison.name}</span>
									</Link>
								</div>
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	);
}
