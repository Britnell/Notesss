// export function pipe<T>(x: T, ...fns: ((x: T) => T)[]) {
//   return (x: T) => fns.reduce((v, f) => f(v), x);
// }

import type { MdxLine } from '../preact/MarkDown';

export function pipe(x: any, ...fns: ((x: any) => any)[]) {
  return fns.reduce((v, f) => f(v), x);
}

export const tabs = ['notes', 'todos', 'habits', 'links'];

export const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const months: Record<string, string> = {
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

export const getDayNth = (day: number) => {
  if (day > 10 && day < 20) return 'th';
  const dig = day % 10;
  if (dig === 1) return 'st';
  if (dig === 2) return 'nd';
  if (dig === 3) return 'rd';
  return 'th';
};

type MdxBlock = {
  type: string;
  items: MdxLine[];
};

export const groupLineBlocks = (lines: MdxLine[]) => {
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

export const getToday = () => new Date().toISOString().split('T')[0];
