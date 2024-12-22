import { useRef, useState } from "preact/hooks";
import type { Note } from "../db/schema";
import { pipe } from "../lib/helper";

const today = new Date().toISOString().split("T")[0];

type NoteBlock = Note & {
  blocks: MdxBlock[];
};

type MdxBlock = {
  type: string;
  items: MdxLine[];
};

type MdxLine = {
  type: string;
  text: string;
  done: boolean;
  level: number;
};

export default function Home(props: { notes: NoteBlock[] }) {
  const [notes, setNotes] = useState(props.notes);
  const blocks = notes.map((n) => ({ ...n, blocks: parseMdBlocks(n.text) }));

  const missingTodays = notes[0].date !== today;

  console.log(notes, blocks);

  const saveNote = (date: string, newText: string, oldText: string) => {
    const newNote = { date, text: newText };

    // optimistic
    setNotes((_notes) =>
      _notes.map((n) => (n.date === date ? { ...n, text: newText } : n))
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
          _notes.map((n) => (n.date === date ? { ...n, text: oldText } : n))
        );
      });
  };

  const addToday = () => {
    const empty = { date: today, text: "", blocks: [] };
    // optim
    setNotes((n) => [empty, ...n]);

    fetch("/api/create", {
      method: "POST",
      body: JSON.stringify(empty),
    });
  };
  return (
    <>
      <header className="flex justify-between px-6">
        <span>Notesss</span>
        <span>x</span>
      </header>
      <main className="px-6">
        <div className=" flex flex-col justify-stretch gap-6">
          {missingTodays && (
            <div className="x">
              <div>{today}</div>
              <button className=" border border-white" onClick={addToday}>
                add todays note
              </button>
            </div>
          )}
          {blocks.map((note) => (
            <Note key={note.date} note={note} saveNote={saveNote} />
          ))}
        </div>
      </main>
    </>
  );
}

const Note = ({
  note,
  saveNote,
}: {
  note: NoteBlock;
  saveNote: (date: string, newText: string, oldText: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [editedMd, setEditedMd] = useState("");
  const [height, setHeight] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLDivElement>(null);

  return (
    <div className="">
      <div className="x">{note.date}</div>
      <div className=" bg-slate-800 p-2 ">
        {!editing && (
          <div ref={previewRef} className="p-2">
            <div className="markdown">
              {note.blocks.map(({ type, items }, i) => (
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
                saveNote(note.date, editedMd, note.text);
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

const parseLines = (lines: string[]) => {
  return pipe(lines.join("<br>"), (s) => s);
};

const MarkDownBlock = ({ type, items }: { type: string; items: MdxLine[] }) => {
  switch (type) {
    case "heading":
      return (
        <>
          {items.map((it) => {
            const Tag = `h${it.level + 1}`;
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
            <li key={i}>
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
const parseMdBlocks = (md: string) => {
  const blocks: any[] = [];
  const parsed = md.split("\n").map((l) => parseLine(l));

  parsed.forEach((line, l) => {
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

const parseLine = (line: string) => {
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

  const heading = /^(\#{1,3})\s/;
  const isheading = line.match(heading);
  if (isheading) {
    const level = isheading[1].length;
    return {
      type: `heading`,
      level: level,
      text: line,
    };
  }

  return {
    type: "p",
    text: line,
  };
};
