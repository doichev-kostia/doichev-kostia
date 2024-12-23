import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const brandedID = (name: string) => text(name);

export const id = {
	get id() {
		return brandedID("id").primaryKey().notNull();
	},
};

export const timestamps = {
	get createTime() {
		return text("create_time").notNull().$default(() => new Date().toISOString());
	},
	get updateTime() {
		return text("update_time").notNull().$default(() => new Date().toISOString()).$onUpdateFn(() => new Date().toISOString());
	},
};

export const deleteTime = {
	get deleteTime() {
		return text("delete_time");
	}
};

export const notes = sqliteTable("notes", {
	...id,
	...timestamps,
	...deleteTime,
	title: text("title").notNull(),
	slug: text("slug").notNull().unique(),
	publicHTML: text("public_html").notNull(),
});
