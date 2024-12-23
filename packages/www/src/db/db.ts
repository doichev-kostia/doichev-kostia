import { createContext } from "~/lib/context";
import * as schema from "./schema";
import { type DrizzleD1Database } from "drizzle-orm/d1";

export type Database = DrizzleD1Database<typeof schema>;
export const DatabaseContext = createContext<Database>("Database");

export function db() {
	return DatabaseContext.mustUse();
}
