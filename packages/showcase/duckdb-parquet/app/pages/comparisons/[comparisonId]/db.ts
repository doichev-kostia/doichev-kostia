import { Comparison } from "~/core/comparison/comparison";
import type { ExpressionBuilder, ExpressionWrapper, Kysely, SqlBool } from "kysely";
import { ClientComparison } from "~/core/comparison/client";
import { type Database } from "~/.client/duckdb";
import { z } from "zod";
import { filterItemSchema, filterModelSchema, type Parameters } from "./hooks";
import { match, P } from "ts-pattern";
import { GridLogicOperator } from "@mui/x-data-grid";

const isNumber = (v: any) => {
	if (typeof v === "number") return true;

	if (v === "") return false;
	const casted = Number(v);
	return casted != Number.NaN;
};

function mapFilterItemToSql(
	eb: ExpressionBuilder<Database, ClientComparison.TableName>,
	filterItem: z.infer<typeof filterItemSchema>,
): ExpressionWrapper<Database, ClientComparison.TableName, SqlBool> | undefined {
	const column = Comparison.Row.keyof().parse(filterItem.field);

	/**
	 * Note: here we only handle the number columns, when the data model changes, we need to update this function
	 * For instance, the isEmpty and isNotEmpty operators can mean = '' and != ''
	 */

	return match(filterItem)
		.with({ operator: "=" }, (f) => eb(column, "=", f.value))
		.with({ operator: ">", value: P.when(isNumber) }, (f) => eb(column, ">", Number(f.value)))
		.with({ operator: ">=", value: P.when(isNumber) }, (f) =>
			eb(column, ">=", Number(f.value)),
		)
		.with({ operator: "isEmpty" }, (f) => eb(column, "is", null))
		.with({ operator: "isNotEmpty" }, (f) => eb(column, "is not", null))
		.with({ operator: "<", value: P.when(isNumber) }, (f) => eb(column, "<", Number(f.value)))
		.with({ operator: "<=", value: P.when(isNumber) }, (f) =>
			eb(column, "<=", Number(f.value)),
		)
		.with({ operator: "!=" }, (f) => eb(column, "!=", f.value))
		.with({
			operator: "isAnyOf",
			value: P.when(x => Array.isArray(x) && x.length > 0),
		}, (f) => eb(column, "in", f.value))
		.otherwise(() => undefined);
}

function mapFilterModel(eb: ExpressionBuilder<Database, ClientComparison.TableName>, filterModel: z.infer<typeof filterModelSchema>) {
	const items = filterModel.items
		.map(f => mapFilterItemToSql(eb, f)!)
		.filter(Boolean);

	return match(filterModel)
		.with({ logicOperator: GridLogicOperator.And }, () => eb.and(items))
		.with({ logicOperator: GridLogicOperator.Or }, () => eb.or(items))
		.otherwise(() => eb.and(items));
}


export async function queryComparisonRows(db: Kysely<Database>, comparisonId: string, parameters: Parameters, { signal }: { signal: AbortSignal }) {
	const tableName = ClientComparison.createTableName(comparisonId);

	const qb = db
		.selectFrom(tableName)
		.$if(!!parameters.filter, qb => qb.where(eb => mapFilterModel(eb, parameters.filter!)));

	const selectQuery = qb
		.selectAll()
		.offset(parameters.offset)
		.limit(parameters.limit)
		.orderBy(parameters.field, parameters.direction);

	const countQuery = qb.select((eb) => eb.fn.countAll().as("count"));

	const [rows, count] = await Promise.all([
		selectQuery.execute(),
		countQuery.execute().then(xs => Number(xs[0].count)),
	]);

	return { rows, count };
}
