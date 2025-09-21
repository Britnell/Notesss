// export function pipe<T>(x: T, ...fns: ((x: T) => T)[]) {
//   return (x: T) => fns.reduce((v, f) => f(v), x);
// }

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
