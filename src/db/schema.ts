import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { type InferSelectModel } from "drizzle-orm";

export type Note = InferSelectModel<typeof notes>;
export type Todo = InferSelectModel<typeof todos>;

export const notes = sqliteTable("notes", {
  date: text("date").primaryKey().notNull(),
  text: text("text").notNull(),
});

export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey(),
  noteDate: text("noteDate").references(() => notes.date),
  done: integer("done").notNull().default(0),
  text: text("text").notNull(),
});
