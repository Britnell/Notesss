import { useEffect, useRef, useState } from "preact/hooks";
import type { Note } from "../db/schema";
import {
  extractMdHabits,
  extractMdLinks,
  extractMdTags,
  MarkDownBlock,
  parseMdLine,
  type MdxLine,
} from "./MarkDown";
import type { VNode } from "preact";

const today = new Date().toISOString().split("T")[0];

type NoteBlock = Note & {
  lines: MdxLine[];
  tags: string[];
  habits: Habit[];
  links: Link[];
};

type Link = {
  text: string;
  href: string;
};
type Habit = {
  type: "habit";
  name: string;
  value?: number;
};

const tabs = ["notes", "todos", "links", "habits"];

const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const months: Record<string, string> = {
  "01": "Jan",
  "02": "Feb",
  "03": "Mar",
  "04": "Apr",
  "05": "May",
  "06": "Jun",
  "07": "Jul",
  "08": "Aug",
  "09": "Sep",
  "10": "Oct",
  "11": "Nov",
  "12": "Dec",
};

type User = {
  id: string;
  name: string;
};

export default function App(props: { notes: Note[]; user: User }) {
  const [notes, setNotes] = useState(props.notes);
  const [currentTab, setCurrentTab] = useState(tabs[0]);
  const [search, setSearch] = useState("");

  const dateBlocks = notes
    .map((n) => ({
      ...n,
      lines: n.text.split("\n").map((l) => parseMdLine(l)),
      tags: extractMdTags(n.text),
      habits: extractMdHabits(n.text),
      links: extractMdLinks(n.text),
    }))
    .filter((note) => note.text !== "x")
    .sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return db.getTime() - da.getTime();
    });
  const userId = props.user.id;

  function saveNote(editNote: Note, newText: string) {
    const newNote = { ...editNote, text: newText };

    // optimistic
    setNotes((_notes) =>
      _notes.map((n) => (n.id === editNote.id ? newNote : n))
    );

    fetch("/api/update", {
      method: "POST",
      body: JSON.stringify(newNote),
    })
      .then((res) => {
        if (!res.ok) throw new Error("not ok");
      })
      .catch(() => {
        setNotes((_notes) =>
          _notes.map((n) => (n.id === editNote.id ? editNote : n))
        );
      });
  }

  function addNote(createDate: string) {
    // reset deleted note
    const existing = notes.find((n) => n.date === createDate);
    if (existing?.text === "x") {
      setNotes((n) =>
        n.map((note) =>
          note.id === existing.id ? { ...note, text: "" } : note
        )
      );
      return;
    }
    if (existing) {
      // do nothing
      return;
    }

    // Optimistic creation
    const tempId = Date.now();
    const empty = {
      id: tempId,
      date: createDate,
      text: "",
      userId,
    };
    setNotes((n) => [empty, ...n]);

    fetch("/api/create", {
      method: "POST",
      body: JSON.stringify(empty),
    })
      .then((res) => res.json())
      .then((created) => {
        setNotes((_notes) =>
          _notes.map((n) => (n.id === tempId ? created : n))
        );
      })
      .catch(() => {
        setNotes((n) => n.filter((n) => n.id !== tempId));
      });
  }

  return (
    <div class=" max-w-[1200px] mx-auto">
      <header className="flex py-2 px-6 bg-slate-800 justify-between">
        <span>Notesss</span>
        <div className=" border border-white px-2 py-1 ">
          <span className=" pr-2">?</span>
          <input
            name="q"
            className=" bg-transparent text-white"
            value={search}
            onChange={(e) => setSearch((e.target as HTMLInputElement)?.value)}
          />
        </div>
        <a href="/logout">logout</a>
      </header>

      <aside className=" fixed z-10 right-0 bottom-0 top-[50px] w-18 pb-20">
        <div className=" h-full p-3 flex flex-col justify-center gap-3">
          {tabs.map((tab) => (
            <button
              className={
                " aspect-square text-xs p-[2px] " +
                (tab === currentTab ? " bg-white text-slate-800" : "")
              }
              onClick={() => setCurrentTab(tab)}
            >
              {tab}
            </button>
          ))}
          <AddButton addNote={addNote} />
        </div>
      </aside>

      <main className="px-6 max-w-[70ch] mx-auto my-6 space-y-4">
        {currentTab === "notes" && (
          <Notes blocks={dateBlocks} saveNote={saveNote} addNote={addNote} />
        )}
        {currentTab === "todos" && (
          <>
            {dateBlocks.map((note) => (
              <Todo key={note.date} note={note} />
            ))}
          </>
        )}
        {currentTab === "links" && (
          <div>
            {dateBlocks.map((note) => (
              <Link key={note.date} note={note} />
            ))}
          </div>
        )}
        {currentTab === "habits" && (
          <div className=" ">
            {dateBlocks.map((note) => {
              if (note.habits.length === 0) return null;
              return (
                <NoteCard date={note.date}>
                  <div className="x">
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
        <button
          onClick={() => setOpen(true)}
          className=" w-full aspect-square text-xs p-[2px] "
        >
          +
        </button>
      )}
      {open && (
        <form onSubmit={onSubmit}>
          <div className="absolute right-0  flex gap-2 z-20 ">
            <div className="x">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate((e.target as HTMLInputElement)?.value)}
                className=""
              />
            </div>
            <button type="submit">+</button>
            <button
              type="button"
              className=" size-8   "
              onClick={() => setOpen(false)}
            >
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
  const missingTodays = blocks[0]?.date !== today;
  // const months = new Set(blocks.map((bl) => new Date(bl.date).getMonth() + 1));
  const monthBlocks = blocks.reduce(
    (acc: Record<number, NoteBlock[]>, bl: NoteBlock) => {
      const month = new Date(bl.date).getMonth() + 1;
      if (!acc[month]) acc[month] = [];
      acc[month].push(bl);
      return acc;
    },
    {}
  );

  return (
    <>
      {missingTodays && (
        <div className="">
          <div>{today}</div>
          <button
            className=" border border-white"
            onClick={() => addNote(today)}
          >
            add todays note
          </button>
        </div>
      )}
      {Object.values(monthBlocks).map((bls) => (
        <MonthBlock key={`m-${bls[0].date}`} date={bls[0].date}>
          {bls.map((note) => (
            <Note key={`d-${note.date}`} note={note} saveNote={saveNote} />
          ))}
        </MonthBlock>
      ))}
    </>
  );
};

const MonthBlock = ({
  date,
  children,
}: {
  date: string;
  children: VNode | VNode[];
}) => {
  const [y, m] = date.split("-");
  return (
    <div key={y + m} className="month">
      <h3 className=" text-xl text-right">
        {months[m]} {y}
      </h3>
      <div className=" space-y-4">{children}</div>
    </div>
  );
};

const getDayNth = (day: number) => {
  if (day > 10 && day < 20) return "th";
  const dig = day % 10;
  if (dig === 1) return "st";
  if (dig === 2) return "nd";
  if (dig === 3) return "rd";
  return "th";
};
const NoteCard = (props: { date: string; children: VNode | VNode[] }) => {
  const date = new Date(props.date);
  const day = days[date.getDay()];
  const d = date.getDate();
  return (
    <div className=" card relative ">
      <h3 className=" text-xl mb-1 flex justify-center items-end ">
        <span className="mr-2">{day}</span>
        {d}
        <span className=" ml-1 text-base">{getDayNth(d)}</span>
      </h3>
      <div className=" relative bg-slate-800 p-2 rounded-lg ">
        {props.children}
      </div>
    </div>
  );
};

const Link = ({ note }: { note: NoteBlock }) => {
  if (note.links.length === 0) return null;

  return (
    <NoteCard date={note.date}>
      <ul className="space-y-3 list-disc ml-6">
        {note.links.map((l) => (
          <li>
            <a className="underline w-full flex " href={l.href}>
              <span className="capitalize">{l.text}</span> : &nbsp;&nbsp;&nbsp;
              <span className=" flex-auto text-ellipsis">{l.href}</span>
            </a>
          </li>
        ))}
      </ul>
    </NoteCard>
  );
};

const Note = ({
  note,
  saveNote,
}: {
  note: NoteBlock;
  saveNote: (note: Note, newText: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [editedMd, setEditedMd] = useState("");
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
      if (ev.code === "Escape") {
        onBlur();
      }
      if (ev.code === "Enter") {
        const ctrl = ev.ctrlKey || ev.metaKey;
        if (ctrl) onBlur();
        else setHeight((h) => h + 24);
      }
    };
    const textarea = editRef.current?.querySelector("textarea");

    textarea?.addEventListener("blur", onBlur);
    textarea?.addEventListener("keydown", onKey);
    previewRef.current?.addEventListener("dblclick", onDoubleClick);
    return () => {
      textarea?.removeEventListener("blur", onBlur);
      textarea?.removeEventListener("keydown", onKey);
      previewRef.current?.removeEventListener("dblclick", onDoubleClick);
    };
  }, [editing, editedMd]);

  const startEditing = () => {
    const h = previewRef.current?.getBoundingClientRect().height;
    h && setHeight(h);
    setEditedMd(note.text);
    setEditing(true);
    setTimeout(() => editRef.current?.querySelector("textarea")?.focus(), 50);
  };

  const onNoteClick = (ev: MouseEvent) => {
    const tg = ev.target as HTMLInputElement;
    const isCheckbox = tg.type === "checkbox";
    if (!isCheckbox) return;
    const label = tg.parentNode?.querySelector("label")?.textContent;
    const reg = new RegExp(`-\\[[x ]\\]\\s+${label}`);
    const match = reg.exec(note.text);
    if (match === null) throw new Error(" cant find todo in the note");
    const i = match.index + 2;
    const toggled = note.text[i] === "x" ? " " : "x";
    const newText = note.text.slice(0, i) + toggled + note.text.slice(i + 1);
    saveNote(note, newText);
  };

  return (
    <NoteCard date={note.date}>
      <>
        {!editing && (
          <div ref={previewRef} className="px-2">
            <div className="markdown" onClick={onNoteClick}>
              {blocks.map(({ type, items }, i) => (
                <MarkDownBlock
                  key={`md-${i}-${type}`}
                  type={type}
                  items={items}
                />
              ))}
            </div>
          </div>
        )}
        {editing && (
          <div ref={editRef}>
            <textarea
              className={" w-full p-2 max-h-[50vh] "}
              value={editedMd}
              onInput={(ev) =>
                setEditedMd((ev.target as HTMLInputElement).value)
              }
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
            {note.habits.map((habit) => (
              <div className=" ">
                <span>
                  {habit.name}
                  {habit.value}
                </span>
              </div>
            ))}
            {note.tags.map((tag, i) => (
              <span className=" " key={i + tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </>
    </NoteCard>
  );
};

const Todo = ({ note }: { note: NoteBlock }) => {
  const todos = note.lines.filter((l) => l.type === "todo");
  if (todos.length === 0) return null;

  return (
    <NoteCard date={note.date}>
      <ul className="space-y-3">
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
