import { useEffect, useRef, useState } from 'preact/hooks';
import type { Note } from '../db/schema';
import {
  extractMdHabits,
  extractMdLinks,
  extractMdMentions,
  extractMdTags,
  MarkDownBlock,
  parseMdLine,
  type MdxLine,
} from './MarkDown';
import type { VNode } from 'preact';

const today = new Date().toISOString().split('T')[0];

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

const tabs = ['notes', 'todos', 'habits', 'links'];

const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const months: Record<string, string> = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Apr',
  '05': 'May',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Aug',
  '09': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dec',
  1: 'Jan',
  2: 'Feb',
  3: 'Mar',
  4: 'Apr',
  5: 'May',
  6: 'Jun',
  7: 'Jul',
  8: 'Aug',
  9: 'Sep',
};

type User = {
  id: string;
  name: string;
};

export default function App(props: { notes: Note[]; user: User }) {
  const [notes, setNotes] = useState(props.notes);
  const [currentTab, setCurrentTab] = useState(tabs[0]);
  const [search, setSearch] = useState('');

  const dateBlocks = notes
    .map((n) => ({
      ...n,
      lines: n.text.split('\n').map((l) => parseMdLine(l)),
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
      <header className="flex py-2 px-6 bg-slate-800 justify-between">
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

      <aside className=" fixed z-10 right-0 bottom-0 top-[50px] w-18 pb-20">
        <div className=" h-full p-3 flex flex-col justify-center gap-3">
          {tabs.map((tab) => (
            <button
              className={' aspect-square text-xs p-[2px] ' + (tab === currentTab ? ' bg-white text-slate-800' : '')}
              onClick={() => setCurrentTab(tab)}
            >
              {tab}
            </button>
          ))}
          <AddButton addNote={addNote} />
        </div>
      </aside>

      <main className="px-6 max-w-[70ch] mx-auto my-6 space-y-4 pb-10">
        {currentTab === 'notes' && (
          <>
            <Notes blocks={dateBlocks} saveNote={saveNote} addNote={addNote} />
            <Loader callback={loadMore} />
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
  return (
    <div className="relative ">
      {!open && (
        <button onClick={() => setOpen(true)} className=" w-full aspect-square text-xs p-[2px] ">
          +
        </button>
      )}
      {open && (
        <form onSubmit={onSubmit}>
          <div className="absolute right-0  flex gap-2 z-20 ">
            <div className="">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate((e.target as HTMLInputElement)?.value)}
                className=""
              />
            </div>
            <button type="submit">+</button>
            <button type="button" className=" size-8   " onClick={() => setOpen(false)}>
              x
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

const Notes = ({
  blocks,
  saveNote,
  addNote,
}: {
  blocks: NoteBlock[];
  saveNote: (note: Note, newText: string) => void;
  addNote: (date: string) => void;
}) => {
  const missingTodays = blocks.findIndex((n) => n.date === today) === -1;

  const monthBlocks = Object.values(
    blocks.reduce((acc: Record<string, NoteBlock[]>, bl: NoteBlock) => {
      const yearMonth = bl.date.slice(0, 7);
      if (!acc[yearMonth]) acc[yearMonth] = [];
      acc[yearMonth].push(bl);
      return acc;
    }, {}),
  ).sort((a, b) => (b[0].date > a[0].date ? 1 : -1));

  return (
    <>
      {missingTodays && (
        <div className="">
          <div>{today}</div>
          <button className=" border border-white" onClick={() => addNote(today)}>
            add todays note
          </button>
        </div>
      )}
      {monthBlocks.map((bls) => (
        <MonthBlock key={`m-${bls[0].date}`} date={bls[0].date}>
          {bls.map((note) => (
            <Note key={`d-${note.date}`} note={note} saveNote={saveNote} />
          ))}
        </MonthBlock>
      ))}
    </>
  );
};

const MonthBlock = ({ date, children }: { date: string; children: VNode | VNode[] }) => {
  const [y, m] = date.split('-');
  return (
    <div key={y + m} className="month">
      <h3 className=" text-xl text-right sticky top-0 z-10 py-2 bg-slate-900">
        {months[m]} {y}
      </h3>
      <div className=" space-y-4">{children}</div>
    </div>
  );
};

const getDayNth = (day: number) => {
  if (day > 10 && day < 20) return 'th';
  const dig = day % 10;
  if (dig === 1) return 'st';
  if (dig === 2) return 'nd';
  if (dig === 3) return 'rd';
  return 'th';
};
const NoteCard = ({
  datestr,
  children,
  showMonth = false,
}: {
  datestr: string;
  children: VNode | VNode[];
  showMonth?: boolean;
}) => {
  const date = new Date(datestr);
  const nth = date.getDate();
  const d = date.getDay();
  const weekday = days[d];
  let col = d === 0 ? 7 : d;
  return (
    <div className=" card relative ">
      <h3 className=" text-xl mb-1 sticky top-0 z-10 py-2 grid grid-cols-7 max-w-[500px] ">
        <div style={{ gridColumnStart: col }}>
          <span className="mr-2">{weekday}</span>
          <span>{nth}</span>
          <span className=" ml-1 text-base">{getDayNth(nth)}</span>
        </div>
        {showMonth && <span className=" ml-4">{months[date.getMonth() + 1]}</span>}
      </h3>
      <div className=" relative bg-slate-800 p-2 rounded-lg ">{children}</div>
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
            <a className="underline w-full flex " href={l.href} target="_blank" rel="noopener noreferrer">
              <span className="capitalize">{l.text}</span> : &nbsp;&nbsp;&nbsp;
              <span className=" flex-auto text-ellipsis">{l.href}</span>
            </a>
          </li>
        ))}
      </ul>
    </NoteCard>
  );
};

const Note = ({ note, saveNote }: { note: NoteBlock; saveNote: (note: Note, newText: string) => void }) => {
  const [editing, setEditing] = useState(false);
  const [editedMd, setEditedMd] = useState('');
  const [height, setHeight] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLDivElement>(null);
  const blocks = groupLineBlocks(note.lines);

  useEffect(() => {
    const onBlur = () => {
      saveNote(note, editedMd);
      setEditing(false);
    };
    const onDoubleClick = () => startEditing();

    const onKey = (ev: KeyboardEvent) => {
      if (ev.code === 'Escape') {
        onBlur();
      }
      if (ev.code === 'Enter') {
        const ctrl = ev.ctrlKey || ev.metaKey;
        if (ctrl) onBlur();
        else setHeight((h) => h + 24);
      }
    };
    const textarea = editRef.current?.querySelector('textarea');

    textarea?.addEventListener('blur', onBlur);
    textarea?.addEventListener('keydown', onKey);
    previewRef.current?.addEventListener('dblclick', onDoubleClick);
    return () => {
      textarea?.removeEventListener('blur', onBlur);
      textarea?.removeEventListener('keydown', onKey);
      previewRef.current?.removeEventListener('dblclick', onDoubleClick);
    };
  }, [editing, editedMd]);

  const startEditing = () => {
    const h = previewRef.current?.getBoundingClientRect().height;
    h && setHeight(h);
    setEditedMd(note.text);
    setEditing(true);
    setTimeout(() => editRef.current?.querySelector('textarea')?.focus(), 50);
  };

  const onNoteClick = (ev: MouseEvent) => {
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
      <>
        {!editing && (
          <div ref={previewRef} className="px-2">
            <div className="markdown" onClick={onNoteClick}>
              {blocks.map(({ type, items }, i) => (
                <MarkDownBlock key={`md-${i}-${type}`} type={type} items={items} />
              ))}
            </div>
          </div>
        )}
        {editing && (
          <div ref={editRef}>
            <textarea
              className={' w-full p-2 max-h-[70vh] '}
              value={editedMd}
              onInput={(ev) => setEditedMd((ev.target as HTMLInputElement).value)}
              style={{ height: `${height}px` }}
            />
          </div>
        )}
        {!editing && (
          <button
            className=" absolute top-2 right-2 size-8 rounded-full border-none hover:bg-slate-900"
            onClick={startEditing}
          >
            ✎
          </button>
        )}
      </>
      <>
        {note.habits.length + note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 rounded bg-slate-900 px-2 py-[2px] w-fit font-extralight ">
            {note.habits.map((habit, i) => (
              <div className=" " key={habit.name + i}>
                <span>
                  {habit.name}
                  {habit.value}
                </span>
              </div>
            ))}
            {note.tags.map((tag, i) => (
              <span className=" " key={tag + i}>
                {tag}
              </span>
            ))}
            {note.mentions.map((tag, i) => (
              <span className=" " key={tag + i}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </>
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

type MdxBlock = {
  type: string;
  items: MdxLine[];
};

const groupLineBlocks = (lines: MdxLine[]) => {
  const blocks: MdxBlock[] = [];

  lines.forEach((line, l) => {
    if (l === 0) {
      blocks.push({ type: line.type, items: [line] });
      return;
    }
    const lastLine = blocks[blocks.length - 1];
    if (line.type === lastLine.type) {
      lastLine.items.push(line);
    } else {
      blocks.push({ type: line.type, items: [line] });
    }
  });

  return blocks;
};

//
