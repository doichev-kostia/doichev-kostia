import { Context } from "~/lib/context";
import * as schema from "./schema";
import { type DrizzleD1Database } from "drizzle-orm/d1";

export type Database = DrizzleD1Database<typeof schema>;
export const DatabaseContext = Context.create<Database>("Database");

export function db() {
	return DatabaseContext.mustUse();
}
