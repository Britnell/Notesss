// export function pipe<T>(x: T, ...fns: ((x: T) => T)[]) {
//   return (x: T) => fns.reduce((v, f) => f(v), x);
// }

export function pipe(x: any, ...fns: ((x: any) => any)[]) {
  return fns.reduce((v, f) => f(v), x);
}
