import { and, desc, eq } from "drizzle-orm";
import { notes, type Note } from "./schema";
import { db, tursoClient } from "./turso";

export const exec = (sql: string) => tursoClient.execute(sql);

export const createNote = (data: Note) =>
  db.insert(notes).values(data).returning();

export const updateNote = ({ text, date, userId }: Note) =>
  db
    .update(notes)
    .set({ text })
    .where(and(eq(notes.userId, userId), eq(notes.date, date)))
    .returning()
    .then((res) => res[0]);

export const allNotes = (uid: string) =>
  db
    .select()
    .from(notes)
    .orderBy(desc(notes.date))
    .where(eq(notes.userId, uid));
