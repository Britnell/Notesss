import { useEffect, useState } from 'preact/hooks';
import type { Note } from '../db/schema';
import { initDB, readNote } from './storage';

let pageload = false;

type CacheListItem = {
  id: number;
  date: string;
  updated: string;
};

type NoteListItem = {
  [date: string]: Note;
};

export function useSync() {
  const [cachelist, setCachelist] = useState<CacheListItem[]>([]);
  const [notes, setNotes] = useState<NoteListItem>({});

  useEffect(() => {
    if (pageload) return;

    initDB();
    getList();

    pageload = true;
  }, []);

  useEffect(() => {
    console.log(notes);
  }, [notes]);

  async function getList() {
    const d = new Date();
    const from = d.toISOString().split('T')[0];
    const res: string | CacheListItem[] = await fetch(`/api/cache?from=${from}`).then((res) =>
      res.ok ? res.json() : res.text(),
    );

    if (typeof res === 'string') {
      console.error(res);
      return;
    }

    const caches = await Promise.all(res.map(async (item: CacheListItem) => readNote(item.date)));

    console.log(res);

    const missing = res.filter((_, i) => !caches[i]).map((n) => n.id);

    console.log({ missing });

    for (let i = 0; i < res.length; i++) {
      // console.log(i, res[i], caches[i]);
    }

    // const missing = await Promise.all(x).filter((row) => row.cache);
    // console.log(missing);

    // res.forEach(async (item: CacheListItem) => {
    //   const cache = await readNote(item.date);
    //   console.log({ item, cache });

    //   // setNotes((n) => ({ ...n, [item.date]: item }));
    // });

    //
  }

  return {};
}
