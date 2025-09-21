import { and, desc, eq, gt, inArray, lt } from 'drizzle-orm';
import { notes } from './schema';
import { db, tursoClient } from './turso';

export const exec = (sql: string) => tursoClient.execute(sql);

export const createNote = (data: { date: string; text: string; userId: string; updated: number }) =>
  db
    .insert(notes)
    .values(data)
    .returning()
    .then((res) => res[0]);

export const updateNote = ({
  text,
  userId,
  id,
  updated,
}: {
  id: number;
  text: string;
  userId: string;
  updated: number;
}) =>
  db
    .update(notes)
    .set({ text, updated })
    .where(and(eq(notes.userId, userId), eq(notes.id, id)))
    .returning()
    .then((res) => res[0]);

export const allNotes = (uid: string) => db.select().from(notes).orderBy(desc(notes.date)).where(eq(notes.userId, uid));

export const getRecent = (uid: string, n: number) =>
  db.select().from(notes).where(eq(notes.userId, uid)).orderBy(desc(notes.date)).limit(n);

export const getRecentAfter = (uid: string, from: string, n: number) =>
  db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, uid), lt(notes.date, from)))
    .orderBy(desc(notes.date))
    .limit(n);

export const checkCache = (uid: string, from: string, n: number) =>
  db
    .select({
      id: notes.id,
      date: notes.date,
      updated: notes.updated,
    })
    .from(notes)
    .where(and(eq(notes.userId, uid), lt(notes.date, from)))
    .orderBy(desc(notes.date))
    .limit(n);

export const getNotesByIds = (uid: string, ids: number[]) =>
  db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, uid), inArray(notes.id, ids)))
    .orderBy(desc(notes.date));
