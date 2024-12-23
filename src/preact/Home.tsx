import { useRef, useState } from "preact/hooks";
import type { Note } from "../db/schema";

const today = new Date().toISOString().split("T")[0];

type NoteBlock = Note & {
  lines: MdxLine[];
  tags: string[];
  habits: Habit[];
};

type MdxLine = {
  type: string;
  text: string;
  done?: boolean;
  level?: number;
};

type Habit = {
  type: "habit";
  name: string;
  value?: number;
};

const tabs = ["home", "todos"];

type User = {
  id: string;
  name: string;
};

export default function Home(props: { notes: Note[]; user: User }) {
  const [notes, setNotes] = useState(props.notes);
  const [tab, setTab] = useState(tabs[0]);

  const dateBlocks = notes.map((n) => ({
    ...n,
    lines: parseMdLines(n.text),
    tags: parseMdTags(n.text),
    habits: parseMdHabits(n.text),
  }));

  const userId = props.user.id;
  const missingTodays = notes[0]?.date !== today;

  const saveNote = (editNote: Note, newText: string) => {
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
  };

  const addToday = () => {
    const empty = {
      id: 0.1,
      date: today,
      text: "",
      blocks: [],
      userId,
    };
    // optim
    setNotes((n) => [empty, ...n]);

    fetch("/api/create", {
      method: "POST",
      body: JSON.stringify(empty),
    })
      .then((res) => {
        if (!res.ok) throw new Error("not ok");
        return res.json();
      })
      .then((created) => {
        setNotes((_notes) =>
          _notes.map((n) => (n.date === today ? created : n))
        );
      })
      .catch(() => {
        setNotes((n) => n.filter((n) => n.date !== today));
      });
  };

  return (
    <>
      <div class=" max-w-[1200px] mx-auto">
        <header className="flex py-2 px-6 bg-slate-800">
          <span>Notesss</span>
          <div className="mx-auto space-x-3">
            {tabs.map((v) => (
              <button onClick={() => setTab(v)}>{v}</button>
            ))}
          </div>
          <a href="/logout">logout</a>
        </header>
        <main className="px-6 max-w-[70ch] mx-auto">
          {tab === "home" && (
            <div className="space-y-6">
              {missingTodays && (
                <div className="">
                  <div>{today}</div>
                  <button className=" border border-white" onClick={addToday}>
                    add todays note
                  </button>
                </div>
              )}
              {dateBlocks.map((note) => (
                <Note key={note.date} note={note} saveNote={saveNote} />
              ))}
            </div>
          )}
          {tab === "todos" && (
            <div>
              {dateBlocks.map((note) => (
                <Todo key={note.date} note={note} />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

const Todo = ({ note }: { note: NoteBlock }) => {
  const todos = note.lines.filter((l) => l.type === "todo");
  if (todos.length === 0) return null;

  return (
    <div className=" py-4">
      <div className="text-center">{note.date}</div>
      <ul className="space-y-3">
        {todos.map((item) => (
          <li className="flex items-center gap-2">
            <input type="checkbox" checked={item.done} className="" />
            <label>{item.text}</label>
          </li>
        ))}
      </ul>
    </div>
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

  return (
    <div className="">
      <div className=" text-center">{note.date}</div>
      <div className="grow flex items-center flex-wrap gap-2 my-1">
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
      <div className=" bg-slate-800 p-2 ">
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
              autoFocus
              className={" w-full p-2 max-h-[50vh] "}
              value={editedMd}
              onChange={(ev) =>
                setEditedMd((ev.target as HTMLInputElement).value)
              }
              style={{ height: `${height}px` }}
            />
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-end gap-2">
        {!editing ? (
          <button
            onClick={() => {
              const h = previewRef.current?.getBoundingClientRect().height;
              h && setHeight(h);
              setEditing(true);
              setEditedMd(note.text);
            }}
          >
            Edit
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                setEditing(false);
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                saveNote(note, editedMd);
                setEditing(false);
              }}
            >
              Save
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const MarkDownBlock = ({ type, items }: { type: string; items: MdxLine[] }) => {
  // PARSE
  switch (type) {
    case "heading":
      return (
        <>
          {items.map((it) => {
            const Tag = `h${(it.level ?? 1) + 1}`;
            // @ts-ignore
            return <Tag>{it.text}</Tag>;
          })}
        </>
      );
    case "p":
      return (
        <p
          dangerouslySetInnerHTML={{
            __html: items.map((it) => it.text).join("<br>"),
          }}
        ></p>
      );
    case "list":
      return (
        <ul>
          {items.map((it, i) => (
            <li key={i}>{it.text}</li>
          ))}
        </ul>
      );
    case "todo":
      return (
        <ul className=" list-none ml-1 ">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-2">
              <input type="checkbox" checked={it.done} />
              <label>{it.text}</label>
            </li>
          ))}
        </ul>
      );
    default:
      return (
        <p>
          Unknown block {type} {items.map((it) => it.text).join(";")}
        </p>
      );
  }
};

type MdxBlock = {
  type: string;
  items: MdxLine[];
};

const parseMdLines = (md: string) => md.split("\n").map((l) => parseMdLine(l));

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

const parseMdLine = (line: string) => {
  const heading = /^(\#{1,3})\s(.*)$/;
  const isheading = line.match(heading);
  if (isheading) {
    return {
      type: `heading`,
      level: isheading[1].length,
      text: isheading[2],
    };
  }

  const todo = /^-\s*\[([x ]?)\]\s*(.*)$/i;
  const istodo = line.match(todo);
  if (istodo)
    return {
      type: "todo",
      text: istodo[2],
      done: istodo[1] === "x",
    };

  const list = /^\s?[-*]\s(.*)$/;
  const islist = line.match(list);
  if (islist)
    return {
      type: "list",
      text: islist[1],
    };

  return {
    type: "p",
    text: line,
  };
};

const parseMdTags = (md: string) =>
  [...md.matchAll(/\B\#\w+/g)].map((match) => match[0].trim());

const parseMdHabits = (md: string) => {
  const habits = /\B\[([A-Z][a-z]*)(\d*)\]\B/g;
  const matches = [...md.matchAll(habits)];
  return matches.map((match) => ({
    type: "habit" as const,
    name: match[1],
    value: parseInt(match[2]) || undefined,
  }));
};
