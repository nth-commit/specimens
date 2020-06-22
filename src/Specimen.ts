import RoseTree from './RoseTree';

export const Skipped = Symbol('Skipped');
export const Exhausted = Symbol('Exhausted');
export type Specimen<T> = RoseTree<T> | typeof Skipped | typeof Exhausted;

export namespace Specimen {
  export const isSkipped = <T>(x: T | typeof Skipped): x is typeof Skipped => x === Skipped;
  export const isNotSkipped = <T>(x: T | typeof Skipped): x is T => !isSkipped(x);

  export const isExhausted = <T>(x: T | typeof Exhausted): x is typeof Exhausted => x === Exhausted;
  export const isNotExhausted = <T>(x: T | typeof Exhausted): x is T => !isExhausted(x);

  export const isAccepted = <T>(specimen: Specimen<T>): specimen is RoseTree<T> =>
    isNotSkipped(specimen) && isNotExhausted(specimen);

  export const discarded = <T>(x: typeof Skipped | typeof Exhausted): Specimen<T> => x;

  export const mapTree = <T, U>(f: (x: RoseTree<T>) => RoseTree<U>, specimen: Specimen<T>): Specimen<U> =>
    isAccepted(specimen) ? f(specimen) : specimen;

  export const map = <T, U>(f: (x: T) => U, specimen: Specimen<T>): Specimen<U> =>
    isAccepted(specimen) ? RoseTree.map(f, specimen) : specimen;

  export const bind = <T, U>(f: (x: T) => Specimen<U>, specimen: Specimen<T>): Specimen<U> =>
    isAccepted(specimen)
      ? f(RoseTree.outcome(specimen)) // TOOD: Tree.bind?
      : discarded<U>(specimen);
}

export default Specimen;
