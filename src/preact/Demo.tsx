import { useEffect, useState } from 'preact/hooks';
import App, { groupLineBlocks } from './App';
import { extractMdHabits, extractMdLines, extractMdMentions, extractMdTags, MarkDownBlock } from './MarkDown';

export default function Demo() {
  const data = [
    {
      id: 123,
      date: '2025-09-01',
      text: '#test',
      updated: 0,
      userId: '1',
    },
  ];

  const user = {
    id: 'x',
    name: 'xx',
  };
  return (
    <div className="relative">
      {!user.id && <App notes={data} user={user} demo />}
      <Demo2 />
    </div>
  );
}

function Demo2() {
  const [demo, setDemo] = useState('');
  const lines = extractMdLines(demo);
  const tags = extractMdTags(demo);
  const habits = extractMdHabits(demo);
  //   const links = extractMdLinks(demo);
  const mentions = extractMdMentions(demo);
  const blocks = groupLineBlocks(lines);

  useEffect(() => {
    setDemo(initialDemo);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className=" relative bg-slate-800 p-2 rounded-lg ">
        <textarea
          className={' h-full w-full p-2  border border-slate-400 '}
          value={demo}
          onInput={(ev) => setDemo((ev.target as HTMLInputElement).value)}
        />
      </div>
      <div className="markdown relative bg-slate-800 p-2 rounded-lg ">
        {blocks.map(({ type, items }, i) => (
          <MarkDownBlock key={`md-${i}-${type}`} type={type} items={items} />
        ))}
        <>
          {habits.length + tags.length > 0 && (
            <div className="flex flex-wrap gap-2 rounded bg-slate-900 px-2 py-[2px] w-fit font-extralight ">
              {habits.map((habit, i) => (
                <div className=" " key={habit.name + i}>
                  <span>
                    {habit.name}
                    {habit.value}
                  </span>
                </div>
              ))}
              {tags.map((tag, i) => (
                <span className=" " key={tag + i}>
                  {tag}
                </span>
              ))}
              {mentions.map((tag, i) => (
                <span className=" " key={tag + i}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </>
      </div>
    </div>
  );
}

const initialDemo = `## Better notes
i love markdown for notes, this  works like usual markdown, and then some on top :
-[x] markdown
-[x] todos
-[x] links
-[x] habits
-[x] hashtags
-[ ] calendar to come

take smarter notes with hashtags #tutorial and @mentions.
links of course work too: [about me](https://britnell.github.io/portfolio/about/)

## habits
i also added habit tracking, directly through markdown, with [swim]
and also track numerical values [Sleep8]

`;
