export const Skipped = Symbol('Skipped');
export const Exhausted = Symbol('Exhausted');
export type Specimen<T> = T | typeof Skipped | typeof Exhausted;

export namespace Specimen {
  export const isSkipped = <T>(x: T | typeof Skipped): x is typeof Skipped => x === Skipped;
  export const isNotSkipped = <T>(x: T | typeof Skipped): x is T => !isSkipped(x);

  export const isExhausted = <T>(x: T | typeof Exhausted): x is typeof Exhausted => x === Exhausted;
  export const isNotExhausted = <T>(x: T | typeof Exhausted): x is T => !isExhausted(x);

  export const isAccepted = <T>(specimen: Specimen<T>): specimen is T =>
    isNotSkipped(specimen) && isNotExhausted(specimen);

  export const isDiscarded = <T>(specimen: Specimen<T>): specimen is typeof Skipped | typeof Exhausted =>
    !isAccepted(specimen);

  export const map = <T, U>(f: (x: T) => U, specimen: Specimen<T>): Specimen<U> =>
    isAccepted(specimen) ? f(specimen) : specimen;
}

export default Specimen;
