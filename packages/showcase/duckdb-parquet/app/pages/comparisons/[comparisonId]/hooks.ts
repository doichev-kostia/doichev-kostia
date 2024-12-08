import { fromThrowable } from "neverthrow";
import { type NavigateOptions, useSearchParams } from "react-router";
import { GridLogicOperator } from "@mui/x-data-grid";
import { Comparison } from "~/core/comparison/comparison";
import { z } from "zod";
import { queryOptions } from "@tanstack/react-query";
import { ClientComparison } from "~/core/comparison/client";
import { db } from "~/.client/duckdb";
import { useCallback } from "react";


const Column = Comparison.Row.keyof();
const Direction = z.enum(["asc", "desc"]);

export const filterItemSchema = z.object({
	field: z.string(),
	value: z.any().nullish(),
	operator: z.string()
});

export const filterModelSchema = z.object({
	items: z.array(filterItemSchema),
	logicOperator: z.nativeEnum(GridLogicOperator).optional(),
})

export type Parameters = {
	offset: number;
	limit: number;
	field: z.infer<typeof Column>;
	direction: z.infer<typeof Direction>;
	filter: z.infer<typeof filterModelSchema> | undefined;
};

export type ParameterSetter = (parameters: {
	offset?: number;
	limit?: number;
	field?: string;
	direction?: z.infer<typeof Direction>;
	filter?: z.infer<typeof filterModelSchema>;
}) => void;

const serializeFilter = (filter?: z.infer<typeof filterModelSchema>) =>
	filter != null ? encodeURIComponent(JSON.stringify(filter)) : undefined;

const options: NavigateOptions = {
	replace: true
}

export function useParameters(): [Parameters, ParameterSetter] {
	let [searchParams, setSearchParams] = useSearchParams();

	const parameters: Parameters = {
		limit: Number(searchParams.get("limit")) || 12,
		offset: Number(searchParams.get("offset")) || 0,
		field: fromThrowable(Column.parse)(searchParams.get("field")).unwrapOr("id"),
		direction: fromThrowable(Direction.parse)(searchParams.get("direction")).unwrapOr("asc"),
		filter: fromThrowable(decodeURIComponent)(searchParams.get("filter") ?? "")
			.andThen(fromThrowable(JSON.parse))
			.andThen(fromThrowable(filterModelSchema.parse))
			.unwrapOr(undefined)
	};

	const setParameters: ParameterSetter = useCallback((params) => {
		if (params.offset !== undefined) {
			setSearchParams(prev => {
				prev.set("offset", params.offset!.toString());
				return prev;
			}, options);
		}
		if (params.limit !== undefined) {
			setSearchParams(prev => {
				prev.set("limit", params.limit!.toString());
				return prev;
			}, options);
		}
		if (params.field !== undefined) {
			setSearchParams(prev => {
				prev.set("field", params.field!);
				return prev;
			}, options);
		}
		if (params.direction !== undefined) {
			setSearchParams(prev => {
				prev.set("direction", params.direction!);
				return prev;
			}, options);
		}
		if (params.filter !== undefined) {
			setSearchParams(prev => {
				prev.set("filter", serializeFilter(params.filter) ?? "");
				return prev;
			}, options);
		}
	}, []);

	return [
		parameters,
		setParameters
	]
}

export function loadParquetOptions(comparisonId: string) {
	return queryOptions({
		queryKey: ["comparisons", comparisonId, "rows.parquet"],
		queryFn: async function loadParquet({ signal }) {
			const response = await fetch(`/api/comparisons/${comparisonId}/rows.parquet`, { signal });
			if (!response.ok) throw new Error("Failed to fetch the parquet rows");
			const bytes = await response.arrayBuffer();
			return await ClientComparison.registerComparisonFile(db, new Uint8Array(bytes), comparisonId);
		},
		staleTime: Infinity
	})
}
