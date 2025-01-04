import { and, desc, eq } from "drizzle-orm";
import { notes } from "./schema";
import { db, tursoClient } from "./turso";

export const exec = (sql: string) => tursoClient.execute(sql);

export const createNote = (data: {
  date: string;
  text: string;
  userId: string;
}) =>
  db
    .insert(notes)
    .values(data)
    .returning()
    .then((res) => res[0]);

export const updateNote = ({
  text,
  userId,
  id,
}: {
  id: number;
  text: string;
  userId: string;
}) =>
  db
    .update(notes)
    .set({ text })
    .where(and(eq(notes.userId, userId), eq(notes.id, id)))
    .returning()
    .then((res) => res[0]);

export const allNotes = (uid: string) =>
  db
    .select()
    .from(notes)
    .orderBy(desc(notes.date))
    .where(eq(notes.userId, uid));
