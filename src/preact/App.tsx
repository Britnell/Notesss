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

const tabs = ["notes", "todos", "links", "cal"];

type User = {
  id: string;
  name: string;
};

export default function App(props: { notes: Note[]; user: User }) {
  const [notes, setNotes] = useState(props.notes);
  const [currentTab, setCurrentTab] = useState(tabs[0]);
  const [search, setSearch] = useState("");

  const dateBlocks = notes.map((n) => ({
    ...n,
    lines: n.text.split("\n").map((l) => parseMdLine(l)),
    tags: extractMdTags(n.text),
    habits: extractMdHabits(n.text),
    links: extractMdLinks(n.text),
  }));
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
    const empty = {
      id: 0.1,
      date: createDate,
      text: "",
      userId,
    };
    // optim
    setNotes((n) => [empty, ...n]);

    fetch("/api/create", {
      method: "POST",
      body: JSON.stringify(empty),
    })
      .then((res) => res.json())
      .then((created) => {
        setNotes((_notes) =>
          _notes.map((n) => (n.date === createDate ? created : n))
        );
      })
      .catch(() => {
        setNotes((n) => n.filter((n) => n.date !== createDate));
      });
  }

  return (
    <div class=" max-w-[1200px] mx-auto">
      <header className="flex py-2 px-6 bg-slate-800 justify-between">
        <span>Notesss</span>
        <div className=" border border-white px-2 py-1 ">
          <span className=" pr-2">?</span>
          <input
            name="search"
            className=" bg-transparent text-white"
            value={search}
            onChange={(e) => setSearch((e.target as HTMLInputElement)?.value)}
          />
        </div>
        <a href="/logout">logout</a>
      </header>

      <aside className=" fixed right-0 bottom-0 top-[50px] w-18 pb-20">
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

      <main className="px-6 max-w-[70ch] mx-auto my-6 space-y-6">
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
      </main>
    </div>
  );
}

const AddButton = ({ addNote }: { addNote: (date: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today);

  return (
    <div className=" relative z-10 ">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className=" w-full aspect-square text-xs p-[2px] "
        >
          +
        </button>
      )}
      {open && (
        <div className="absolute right-0  flex gap-2 ">
          <div className="x">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate((e.target as HTMLInputElement)?.value)}
              className=""
            />
          </div>
          <button onClick={() => addNote(date)}>+</button>
          <button
            className=" w-full aspect-square text-xs p-[2px] "
            onClick={() => setOpen(false)}
          >
            x
          </button>
        </div>
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
      {blocks.map((note) => (
        <Note key={note.date} note={note} saveNote={saveNote} />
      ))}
    </>
  );
};

const NoteCard = ({
  date,
  children,
}: {
  date: string;
  children: VNode | VNode[];
}) => {
  return (
    <div className=" card relative ">
      <h3 className=" text-center text-base">{date}</h3>
      <div className=" bg-slate-800 p-2 rounded-lg ">{children}</div>
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

    const textarea = editRef.current?.querySelector("textarea");

    textarea?.addEventListener("blur", onBlur);
    previewRef.current?.addEventListener("dblclick", onDoubleClick);
    return () => {
      textarea?.removeEventListener("blur", onBlur);
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

  return (
    <NoteCard date={note.date}>
      <>
        {!editing && (
          <div ref={previewRef} className="p-2">
            <div className="markdown">
              {blocks.map(({ type, items }, i) => (
                <MarkDownBlock key={`${i}-${type}`} type={type} items={items} />
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
            className=" absolute top-[34px] right-3"
            onClick={startEditing}
          >
            Edit
          </button>
        )}
      </>
      <div className="mt-2 flex items-center flex-wrap gap-2">
        {note.habits.map((habit) => (
          <div className="px-2 py-1  bg-slate-800 rounded-lg">
            <span>{habit.name}</span>
            <span>{habit.value}</span>
          </div>
        ))}
        {note.tags.map((tag, i) => (
          <span className=" underline" key={i + tag}>
            {tag}
          </span>
        ))}
      </div>
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
