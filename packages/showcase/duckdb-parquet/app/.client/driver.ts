import { type CompiledQuery, type DatabaseConnection, type Driver, type QueryResult } from "kysely";
import type * as duckdb from "@duckdb/duckdb-wasm";


export class DuckDbDriver implements Driver {
	constructor(private client: duckdb.AsyncDuckDB, private mainModuleURL: string, private pthreadWorkerURL?: string | null) {
	}

	async init() {
		await this.client.instantiate(this.mainModuleURL, this.pthreadWorkerURL);
	}

	async acquireConnection(): Promise<DuckDbKyselyConnection> {
		const connection = await this.client.connect();

		return new DuckDbKyselyConnection(connection)
	}

	releaseConnection(connection: DuckDbKyselyConnection): Promise<void> {
		return connection.connection.close();
	}

	async beginTransaction(connection: DuckDbKyselyConnection): Promise<void> {
		throw new Error('DuckDB transactions are not supported');
	}

	async commitTransaction(connection: DuckDbKyselyConnection): Promise<void> {
		throw new Error('DuckDB transactions are not supported');
	}

	async rollbackTransaction(connection: DuckDbKyselyConnection): Promise<void> {
		throw new Error('DuckDB transactions are not supported');
	}

	async destroy() {
		this.client.detach()
	}
}

export class DuckDbKyselyConnection implements DatabaseConnection {
	constructor(public connection: duckdb.AsyncDuckDBConnection) {
	}

	async executeQuery<Result>(query: CompiledQuery): Promise<QueryResult<Result>> {
		const q = await this.connection.prepare(query.sql);
		const result = await q.query(...query.parameters);
		const rows = result.toArray().map((x) => x.toJSON());

		return {
			rows,
		};
	}

	async *streamQuery(): AsyncGenerator<never, void, unknown> {
		throw new Error('DuckDB streaming is not supported');
	}}
