import { desc, eq } from "drizzle-orm";
import { notes, type Note } from "./schema";
import { db, tursoClient } from "./turso";

export const exec = (sql: string) => tursoClient.execute(sql);

export const createNote = (data: Note) =>
  db.insert(notes).values(data).returning();

export const updateNote = ({ text, date }: Note) =>
  db
    .update(notes)
    .set({ text })
    .where(eq(notes.date, date))
    .returning()
    .then((res) => res[0]);

export const allNotes = () => db.select().from(notes).orderBy(desc(notes.date));

export const homeNotes = () =>
  tursoClient.execute(`SELECT date, json_group_array(
 json_object('id', id, 'text', text)
) as items
FROM notes 
GROUP BY date
ORDER BY date DESC
`);
