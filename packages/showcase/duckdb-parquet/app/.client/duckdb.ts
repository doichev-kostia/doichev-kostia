import * as duckdb from "@duckdb/duckdb-wasm";
import mvp_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import eh_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";

import { Kysely, sql, SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler } from "kysely";
import { DuckDbDriver } from "~/.client/driver";
import { ClientComparison } from "~/core/comparison/client";

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
	mvp: {
		mainModule: "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/dist/duckdb-mvp.wasm",
		mainWorker: mvp_worker,
	},
	eh: {
		mainModule: "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/dist/duckdb-eh.wasm",
		mainWorker: eh_worker,
	},
};

const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
const worker = new Worker(bundle.mainWorker!);
const logger = new duckdb.ConsoleLogger();
export const duckDB = new duckdb.AsyncDuckDB(logger, worker);

export interface Database {
	[key: ClientComparison.TableName]: ClientComparison.Table;
}

export const db = new Kysely<Database>({
	dialect: {
		createAdapter() {
			return new SqliteAdapter();
		},
		createDriver() {
			return new DuckDbDriver(duckDB, bundle.mainModule, bundle.pthreadWorker);
		},
		createIntrospector(db: Kysely<unknown>) {
			return new SqliteIntrospector(db);
		},
		createQueryCompiler() {
			return new SqliteQueryCompiler();
		},
	},
});

// init the db
await sql`select 1`.execute(db)


