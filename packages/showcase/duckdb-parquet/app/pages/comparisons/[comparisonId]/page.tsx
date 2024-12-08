import { ServerComparison } from "~/core/comparison/server";
import type { Route } from "./+types/page";
import { queryClient } from "~/query-client";
import { Comparison } from "~/core/comparison/comparison";
import { ClientComparison } from "~/core/comparison/client";
import { db } from "~/.client/duckdb";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryComparisonRows } from "./db";
import React, { useCallback, useState } from "react";
import type { GridColDef, GridFilterModel, GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import { DataGrid } from "@mui/x-data-grid";
import { loadParquetOptions, useParameters } from "./hooks";
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid'
import { Link } from "react-router";

export async function loader({ params }: Route.LoaderArgs) {
	const comparison = await ServerComparison.get(params.comparisonId);
	if (!comparison) throw new Error("Not Found!");
	return comparison;
}

export async function clientLoader({ serverLoader, params }: Route.ClientLoaderArgs) {
	let data = queryClient.getQueryData<Comparison.T>(ClientComparison.detailsOptions(params.comparisonId).queryKey);

	const effects: Array<() => Promise<void>> = [];

	if (!queryClient.getQueryData(loadParquetOptions(params.comparisonId).queryKey)) {
		effects.push(async () => {
			await queryClient.fetchQuery(loadParquetOptions(params.comparisonId));
		});
	}

	if (!data) {
		effects.push(async () => {
			queryClient.setQueryData(ClientComparison.detailsOptions(params.comparisonId).queryKey, await serverLoader());
		});
	}

	await Promise.all(effects.map((x) => x()));

	return {
		...queryClient.getQueryData<Comparison.T>(ClientComparison.detailsOptions(params.comparisonId).queryKey)!,
		table: ClientComparison.createTableName(params.comparisonId),
	};
}

clientLoader.hydrate = true as const;

const pageSizeOptions = [12, 24, 48];

export default function ComparisonPage({ loaderData, params }: Route.ComponentProps) {
	const [parameters, setParameters] = useParameters();
	const [formatter] = useState(new Intl.NumberFormat());

	const { data: comparisonRows, isLoading } = useQuery({
		...ClientComparison.comparisonRowsOptions<{
			items: Array<Comparison.Row>,
			count: number
		}>(params.comparisonId, parameters),
		queryFn: async function queryRows({ signal }) {
			const { rows, count } = await queryComparisonRows(db, params.comparisonId, parameters, { signal });
			return { items: rows, count };
		},
		enabled: !!(loaderData as { table: string }).table,
		placeholderData: keepPreviousData,
	});

	const [columns] = useState<Array<GridColDef<Comparison.Row>>>([
		{ field: "x1", type: "number", valueFormatter: v => formatter.format(v), flex: 150 },
		{ field: "x2", type: "number", valueFormatter: v => formatter.format(v), flex: 150 },
		{
			field: "difference_x",
			headerName: "Difference X",
			type: "number",
			valueFormatter: v => formatter.format(v),
			flex: 150,
		},
		{ field: "y1", type: "number", valueFormatter: v => formatter.format(v), flex: 150 },
		{ field: "y2", type: "number", valueFormatter: v => formatter.format(v), flex: 150 },
		{
			field: "difference_y",
			headerName: "Difference Y",
			type: "number",
			valueFormatter: v => formatter.format(v),
			flex: 150,
		},
	]);

	const updateSort = useCallback((model: GridSortModel) => {
		const sort = model[0];
		if (sort == null) {
			setParameters({
				field: "id",
				direction: "asc",
			});
		} else {
			setParameters({
				field: sort.field,
				direction: sort.sort!,
			});
		}
	}, []);

	const updatePagination = useCallback((model: GridPaginationModel) => {
		setParameters({
			limit: model.pageSize,
			offset: model.page * model.pageSize,
		});
	}, []);

	const updateFilters = useCallback((model: GridFilterModel) => {
		setParameters({
			filter: model,
		});
	}, []);

	return (
		<section className="container mx-auto py-4">
			<header className="mb-5">
				<nav aria-label="Breadcrumb" className="flex">
					<ol role="list" className="flex items-center space-x-4">
						<li>
							<div>
								<Link to="/" className="text-gray-400 hover:text-gray-500">
									<HomeIcon aria-hidden="true" className="size-5 shrink-0" />
									<span className="sr-only">Home</span>
								</Link>
							</div>
						</li>
						<li key="comparison">
							<div className="flex items-center">
								<ChevronRightIcon aria-hidden="true" className="size-5 shrink-0 text-gray-400" />
								<Link
									to="."
									aria-current="page"
									className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
								>
									{loaderData.name}
								</Link>
							</div>
						</li>
					</ol>
				</nav>
			</header>
			<div>
				<DataGrid
					columns={columns}
					getRowId={r => r.id}
					rows={comparisonRows?.items ?? []}
					rowCount={comparisonRows?.count ?? 0}
					loading={isLoading}
					pageSizeOptions={pageSizeOptions}
					filterModel={parameters.filter}
					paginationModel={{
						pageSize: parameters.limit,
						page: parameters.offset / (parameters.limit || 1),
					}}
					sortModel={[{
						field: parameters.field,
						sort: parameters.direction,
					}]}
					onSortModelChange={updateSort}
					onPaginationModelChange={updatePagination}
					onFilterModelChange={updateFilters}
					paginationMode="server"
					filterMode="server"
					disableRowSelectionOnClick
				/>
			</div>
		</section>
	);
}
