export type MdxLine = {
  type: string;
  text: string;
  done?: boolean;
  level?: number;
};

export const MarkDownBlock = ({
  type,
  items,
}: {
  type: string;
  items: MdxLine[];
}) => {
  // PARSE
  switch (type) {
    case "heading":
      return (
        <>
          {items.map((it) => {
            const Tag = `h${(it.level ?? 1) + 1}`;
            return (
              // @ts-ignore
              <Tag>{it.text}</Tag>
            );
          })}
        </>
      );
    case "p":
      return (
        <p>
          {items.map((it) => (
            <MdText md={it.text} />
          ))}
        </p>
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

// md Rendering
const regLink = /\[([^\]]+)\]\(([^)]+)\)/;
const regBold = /\*\*(\w+(?:\s\w+)*)\*\*/;
const regitalic = /\*(\w+(?:\s\w+)*)\*/;
const regTag = /\B\#(\w+)/;
const regHabit = /\B\[([A-Z][a-z]*)(\d*)\]\B/;

const MdText = ({ md }: { md: string }) => {
  let parsing = md;

  // parse [links](...)
  parsing = mdParseLoop(
    parsing,
    regLink,
    (match) => `<a href="${match[2]}">${match[1]}</a>`
  );

  // parse **bold** and *italic*
  parsing = mdParseLoop(parsing, regBold, (match) => `<b>${match[1]}</b>`);
  parsing = mdParseLoop(parsing, regitalic, (match) => `<i>${match[1]}</i>`);

  // parse #tag
  parsing = mdParseLoop(
    parsing,
    regTag,
    (match) =>
      `<span class="font-semibold p-1 text-blue-100"><span>#</span>${match[1]}</span>`
  );

  // parse [habit]
  parsing = mdParseLoop(
    parsing,
    regHabit,
    (match) =>
      `<span class=" px-2 py-1 rounded bg-slate-900 ">${match[1]} ${match[2]}</span>`
  );

  return (
    <span
      className="block"
      dangerouslySetInnerHTML={{ __html: parsing }}
    ></span>
  );
};

const mdParseLoop = (
  md: string,
  regex: RegExp,
  parsedInsertCallback: (match: RegExpMatchArray) => string
) => {
  let parsing = md;
  let match;
  match = parsing.match(regex);
  while (match?.index !== undefined) {
    let bef = parsing.slice(0, match.index);
    let aft = parsing.slice(match.index + match[0].length);
    parsing = bef + parsedInsertCallback(match) + aft;
    match = parsing.match(regex);
  }
  return parsing;
};
