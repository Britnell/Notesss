import { useEffect, useRef, useState } from 'preact/hooks';
import type { Note } from '../db/schema';
import { days, getDayNth, getToday, groupLineBlocks, months, type tabs } from '../lib/helper';
import { MarkDownBlock, type MdxLine } from './MarkDown';
import type { VNode } from 'preact';

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

const today = getToday();

export const Notes = ({
  blocks,
  saveNote,
  addNote,
  demo,
}: {
  blocks: NoteBlock[];
  saveNote: (note: Note, newText: string) => void;
  addNote: (date: string) => void;
  demo: boolean;
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
      {missingTodays && !demo && (
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
      <h3 className=" text-xl text-right sticky top-0 z-10 py-2 bg-slate-950">
        {months[m]} {y.slice(2)}
      </h3>
      <div className=" space-y-4">{children}</div>
    </div>
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

export const NoteCard = ({
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
    <div id={datestr} className="relative">
      <h3 className="text-xl mb-1 sticky top-0 z-10 py-2 sm:grid sm:grid-cols-7 max-w-[500px]">
        <div style={{ gridColumnStart: col }}>
          <span className="mr-2">{weekday}</span>
          <span>{nth}</span>
          <span className=" ml-1 text-base">{getDayNth(nth)}</span>
        </div>
        {showMonth && <span className=" ml-4">{months[date.getMonth() + 1]}</span>}
      </h3>
      <div className="relative bg-slate-900 p-2 rounded-lg ">{children}</div>
    </div>
  );
};
