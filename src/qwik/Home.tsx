// import type { Note } from "../db/schema";

// export const Home = component$((props: { notes: Note[] }) => {
//   const notes = useSignal(props.notes);

//   const saveNote = $((date: string, newText: string, oldText: string) => {
//     // optimistic update
//     const newNote = { date, text: newText };
//     const nx = notes.value.findIndex((n) => n.date === date);
//     notes.value = notes.value.map((n, i) => (i === nx ? newNote : n));

//     //  update req
//     fetch("/api/update", {
//       method: "POST",
//       body: JSON.stringify(newNote),
//     })
//       .then((res) => {
//         if (!res.ok) throw new Error("not ok");
//       })
//       .catch(() => {
//         notes.value = notes.value.map((n, i) =>
//           i === nx ? { date, text: oldText } : n
//         );
//       });
//   });
//   return (
//     <main class="px-6">
//       <div class=" flex flex-col justify-stretch gap-6">
//         {notes.value.map((note) => (
//           <Note note={note} saveNote={saveNote} />
//         ))}
//       </div>
//     </main>
//   );
// });

// const Note = component$(
//   ({
//     note,
//     saveNote,
//   }: {
//     note: Note;
//     saveNote: (date: string, newText: string, oldText: string) => void;
//   }) => {
//     const editing = useSignal(false);
//     const editedMd = useSignal("xxx");

//     return (
//       <div class="">
//         <div class="x">{note.date}</div>
//         <div class=" bg-slate-800 p-3 ">
//           <div class={editing.value ? "hidden" : ""}>
//             <MarkDown md={note.text} />
//           </div>
//           <textarea
//             class={" w-full p-2 " + (editing.value ? "" : "hidden")}
//             bind:value={editedMd}
//             rows={5}
//           />
//         </div>
//         <div class="mt-2 flex justify-end gap-2">
//           <button
//             class={editing.value ? "hidden" : ""}
//             onClick$={() => {
//               editing.value = true;
//               editedMd.value = note.text;
//             }}
//           >
//             Edit
//           </button>
//           <button
//             class={editing.value ? "" : "hidden"}
//             onClick$={() => {
//               editing.value = false;
//               editedMd.value = note.text;
//             }}
//           >
//             Cancel
//           </button>
//           <button
//             class={editing.value ? "" : "hidden"}
//             onClick$={() => {
//               saveNote(note.date, editedMd.value, note.text);
//               editing.value = false;
//             }}
//           >
//             Save
//           </button>
//         </div>
//       </div>
//     );
//   }
// );
// const MarkDown = component$(({ md }: { md: string }) => {
//   const blocks = parseMdBlocks(md);

//   return (
//     <div class="markdown">
//       {blocks.map(([type, lines], i) => (
//         <MarkDownBlock
//           key={`${i}-${type}-${lines.map((l) => l.length).join("")}`}
//           type={type}
//           lines={lines}
//         />
//       ))}
//     </div>
//   );
// });

// const MarkDownBlock = component$(
//   ({ type, lines }: { type: string; lines: string[] }) => {
//     switch (type) {
//       case "h2":
//         return <h2>{lines}</h2>;
//       case "p":
//         return <p>{lines.join("\n")}</p>;
//       case "list":
//         return (
//           <ul>
//             {lines.map((l, i) => (
//               <li key={i}>{l}</li>
//             ))}
//           </ul>
//         );
//       case "todo":
//         return (
//           <div>
//             {lines.map((l, i) => (
//               <span key={i}>
//                 <input type="checkbox" />
//                 <label>{l}</label>
//               </span>
//             ))}
//           </div>
//         );
//       default:
//         return (
//           <p>
//             Unknown block {type} {lines.join(";")}
//           </p>
//         );
//     }
//   }
// );

// export const lineType = (line: string) => {
//   if (line.startsWith("# ")) return "h2";
//   if (line.startsWith("-[")) return "todo";
//   if (line.startsWith("- ")) return "list";
//   if (line.startsWith("* ")) return "list";
//   return "p";
// };

// const parseMdBlocks = (md: string) => {
//   const mdx: Array<[string, Array<string>]> = [];
//   const mdLines = md.split("\n");
//   let lastTy: string | null = null;

//   mdLines.forEach((line, l) => {
//     const ty = lineType(line);
//     if (ty === lastTy) {
//       const lastMd = mdx[mdx.length - 1];
//       lastMd[1].push(line);
//     } else {
//       mdx.push([ty, [line]]);
//     }
//     lastTy = ty;
//   });
//   return mdx;
// };
