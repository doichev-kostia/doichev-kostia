import { queryOptions } from "@tanstack/react-query";
import { queryKeyBuilder } from "~/lib/query-key-builder";
import { Comparison } from "~/core/comparison/comparison";
import { type Database, duckDB } from "~/.client/duckdb";
import { type Kysely, sql } from "kysely";


export module ClientComparison {
	import Row = Comparison.Row;
	export type TableName = `comparison_rows_${string}`;

	export type Table = Row;

	export function createTableName(comparisonId: string): TableName {
		return `comparison_rows_${comparisonId}`;
	}

	export function createFilename(comparisonId: string): string {
		return `comparison_rows_${comparisonId}.parquet`;
	}

	export async function registerComparisonFile(
		db: Kysely<Database>,
		bytes: Uint8Array,
		comparisonId: string) {
		const filename = createFilename(comparisonId);
		await duckDB.registerFileBuffer(filename, bytes);
		const tableName = createTableName(comparisonId);

		await db.schema
			.createTable(tableName)
			.ifNotExists()
			// Duck DB function
			.as(sql`select * from read_parquet(${filename})`)
			.execute();

		return tableName;
	}

	export type Column = keyof Comparison.Row;
	export type Direction = 'asc' | 'desc';

	export type Filters = {
		field: Column;
		direction: Direction;
		limit: number;
		offset: number;
		filter: any | undefined;
	};


	export const listOptions = queryOptions({
		queryKey: queryKeyBuilder("comparisons", "list"),
	});

	export function detailsOptions(id: string) {
		return queryOptions({
			queryKey: queryKeyBuilder("comparisons", "details", id),
		});
	}

	export function comparisonRowsOptions<TQueryFnData = unknown>(comparisonId: string, filters: Filters) {
		return queryOptions<TQueryFnData>({
			queryKey: queryKeyBuilder("comparisons", comparisonId, "rows", filters),
		});
	}
}
