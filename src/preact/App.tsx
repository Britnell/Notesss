import { useEffect, useRef, useState } from 'preact/hooks';
import type { Note } from '../db/schema';
import {
  extractMdHabits,
  extractMdLines,
  extractMdLinks,
  extractMdMentions,
  extractMdTags,
  type MdxLine,
} from './MarkDown';
import { getToday, tabs } from '../lib/helper';
import { NoteCard, Notes } from './Notes';

const today = getToday();

type NoteBlock = Note & {
  lines: MdxLine[];
  tags: string[];
  mentions: string[];
  habits: Habit[];
  links: Link[];
};

type Link = {
  text: string;
  href: string;
};
type Habit = {
  type: 'habit';
  name: string;
  value?: number;
};

type Tab = (typeof tabs)[number];
type User = {
  id: string;
  name: string;
};

type Props = { notes: Note[]; user: User; demo?: boolean };

export default function App(props: Props) {
  const demo = props.demo ?? false;
  const [notes, setNotes] = useState(props.notes);
  const [currentTab, setCurrentTab] = useState<Tab>(tabs[0]);
  const [search, setSearch] = useState('');

  const dateBlocks = notes
    .map((n) => ({
      ...n,
      lines: extractMdLines(n.text),
      tags: extractMdTags(n.text),
      mentions: extractMdMentions(n.text),
      habits: extractMdHabits(n.text),
      links: extractMdLinks(n.text),
    }))
    .filter((note) => {
      if (note.text === 'x') return false;
      if (search === '') return true;

      // simple search filter
      const match = note.text.indexOf(search);
      return match !== -1;
    })
    .sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return db.getTime() - da.getTime();
    });
  const userId = props.user.id;

  function saveNote(editNote: Note, newText: string) {
    const newNote = { ...editNote, text: newText };

    // optimistic
    setNotes((_notes) => _notes.map((n) => (n.id === editNote.id ? newNote : n)));

    fetch('/api/note/update', {
      method: 'POST',
      body: JSON.stringify(newNote),
    })
      .then((res) => {
        if (!res.ok) throw new Error('not ok');
      })
      .catch(() => {
        setNotes((_notes) => _notes.map((n) => (n.id === editNote.id ? editNote : n)));
      });
  }

  function addNote(createDate: string) {
    // reset deleted note
    const existing = notes.find((n) => n.date === createDate);
    if (existing?.text === 'x') {
      setCurrentTab('notes');
      setNotes((n) => n.map((note) => (note.id === existing.id ? { ...note, text: '' } : note)));
      return;
    }
    if (existing) {
      // do nothing
      return;
    }

    const tempId = Date.now();
    const empty = {
      id: tempId,
      date: createDate,
      text: '',
      updated: 0,
      userId,
    };

    // send
    fetch('/api/note/create', {
      method: 'POST',
      body: JSON.stringify(empty),
    })
      .then((res) => res.json())
      .then((created) => {
        setNotes((_notes) => _notes.map((n) => (n.id === tempId ? created : n)));
      })
      .catch(() => {
        setNotes((n) => n.filter((n) => n.id !== tempId));
      });

    // Optimistic creation
    const _next = [...notes, empty].sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return db.getTime() - da.getTime();
    });
    setNotes(_next);
  }

  const loadMore = async () => {
    const oldest = notes[notes.length - 1]?.date;
    console.log({
      oldest,
    });

    const resp = await fetch(`/api/list?from=${oldest}`, {})
      .then((res) => res.json())
      .catch(() => null);

    if (resp.length > 0) setNotes((n) => [...n, ...resp]);
  };

  return (
    <div class=" max-w-[1200px] mx-auto">
      {!demo && (
        <header className="flex py-2 px-6 bg-slate-900 justify-between">
          <span>Notesss</span>
          <div className=" border border-white px-2 py-1 ">
            <span className=" pr-2">?</span>
            <input
              name="q"
              className=" bg-transparent text-white"
              placeholder="search.."
              value={search}
              onInput={(e) => setSearch((e.target as HTMLInputElement)?.value)}
            />
          </div>
          <a href="/logout">logout</a>
        </header>
      )}

      <main className="px-6 max-w-[70ch] mx-auto my-6 space-y-4 pb-10">
        {currentTab === 'notes' && (
          <>
            <Notes blocks={dateBlocks} saveNote={saveNote} addNote={addNote} demo={demo} />
            {!search && !demo && <Loader callback={loadMore} />}
          </>
        )}
        {currentTab === 'todos' && (
          <>
            {dateBlocks.map((note) => (
              <Todo key={note.date} note={note} saveNote={saveNote} />
            ))}
          </>
        )}
        {currentTab === 'links' && (
          <div>
            {dateBlocks.map((note) => (
              <Link key={note.date} note={note} />
            ))}
          </div>
        )}
        {currentTab === 'habits' && (
          <div className=" ">
            {dateBlocks.map((note) => {
              if (note.habits.length === 0) return null;
              return (
                <NoteCard datestr={note.date}>
                  <div className="">
                    {note.habits.map((h) => (
                      <span key={h}>
                        {h.name} {h.value}
                      </span>
                    ))}
                  </div>
                </NoteCard>
              );
            })}
          </div>
        )}
      </main>

      <aside className=" fixed z-10 bottom-0 md:bottom-20 right-2 left-0 md:left-auto md:top-[50px] md:w-10 h-12 md:h-auto bg-slate-900 md:bg-transparent  py-1">
        <div className=" h-full flex md:flex-col justify-center gap-2 md:gap-2 ">
          {tabs.map((tab) => (
            <button
              className={
                ' aspect-square text-xs p-[2px] flex justify-center items-center border-none rounded-md' +
                (tab === currentTab ? ' bg-white text-slate-800' : ' bg-slate-800')
              }
              onClick={() => setCurrentTab(tab)}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                class={tab === currentTab ? ' fill-slate-800 ' : ' fill-white '}
              >
                <use href={`#${tab}`}></use>
              </svg>
            </button>
          ))}
          {!demo && <AddButton addNote={addNote} />}
        </div>
      </aside>
    </div>
  );
}

const Loader = ({ callback }: { callback: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const x = entries[0].isIntersecting;
      if (x) {
        callback();
      }
    }, {});
    observer.observe(ref.current!);
    return () => {
      observer.disconnect();
    };
  }, [callback]);

  return (
    <div ref={ref} className="bg-slate-800 p-2 rounded-lg mb-10">
      <p className="py-8 text-center">LOADING ...</p>
    </div>
  );
};

const AddButton = ({ addNote }: { addNote: (date: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today);

  const onSubmit = (e: Event) => {
    e.preventDefault();
    addNote(date);
    setOpen(false);
  };

  const step = (d: number) => {
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + d);
    setDate(tomorrow.toISOString().split('T')[0]);
  };
  return (
    <div className="relative aspect-square">
      {/* {!open && ( */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="border-none rounded-md w-full aspect-square p-[2px]  bg-slate-800"
      >
        {open ? 'x' : '+'}
      </button>
      {/* )} */}
      {open && (
        <form onSubmit={onSubmit}>
          <div className="absolute flex gap-2 z-20 right-0 md:right-[calc(100%+8px)] bottom-[calc(100%+4px)] md:bottom-auto md:top-0 bg-slate-700 p-[6px] rounded-md">
            <button className="text-xs" type="button" onClick={() => step(-1)}>
              {'<'}
            </button>
            <button className="text-xs" type="button" onClick={() => step(1)}>
              {'>'}
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate((e.target as HTMLInputElement)?.value)}
              className=" bg-transparent w-32"
            />
            <button type="submit">+</button>
            {/* <button type="button" className=" size-8   " onClick={() => setOpen(false)}>
              x
            </button> */}
          </div>
        </form>
      )}
    </div>
  );
};

const Link = ({ note }: { note: NoteBlock }) => {
  if (note.links.length === 0) return null;

  return (
    <NoteCard datestr={note.date}>
      <ul className="space-y-3 list-disc ml-6">
        {note.links.map((l) => (
          <li>
            <a href={l.href} target="_blank" rel="noopener noreferrer" class=" hover:underline">
              <span className="x">{l.text}</span>
              <span className="mt- block text-sm text-slate-400 flex-auto text-ellipsis whitespace-pre overflow-hidden">
                {l.href}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </NoteCard>
  );
};

const Todo = ({ note, saveNote }: { note: NoteBlock; saveNote: (note: Note, newText: string) => void }) => {
  const todos = note.lines.filter((l) => l.type === 'todo');
  if (todos.length === 0) return null;

  const onClick = (ev: MouseEvent) => {
    const tg = ev.target as HTMLInputElement;
    const isCheckbox = tg.type === 'checkbox';

    if (!isCheckbox) return;
    const label = tg.parentNode?.querySelector('label')?.textContent;
    const reg = new RegExp(`-\\[[x ]\\]\\s+${label}`);
    const match = reg.exec(note.text);
    if (match === null) throw new Error(' cant find todo in the note');
    const i = match.index + 2;
    const toggled = note.text[i] === 'x' ? ' ' : 'x';
    const newText = note.text.slice(0, i) + toggled + note.text.slice(i + 1);
    saveNote(note, newText);
  };

  return (
    <NoteCard datestr={note.date}>
      <ul className="space-y-3" onClick={onClick}>
        {todos.map((item) => (
          <li className="flex items-center gap-2">
            <input type="checkbox" checked={item.done} className="" />
            <label>{item.text}</label>
          </li>
        ))}
      </ul>
    </NoteCard>
  );
};
