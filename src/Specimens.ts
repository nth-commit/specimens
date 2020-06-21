import Numeric, { Integer } from './Numeric';
import Random from './Random';
import RoseTree from './RoseTree';
import Sequence from './Sequence';
import Range, { Size, IntegerRange } from './Range';
import Shrink from './Shrink';
import Seed from './Seed';

export const Skipped = Symbol();
export const Exhausted = Symbol();
export type Specimen<T> = T | typeof Skipped | typeof Exhausted;

export namespace Specimen {
  export const isSkipped = <T>(x: T | typeof Skipped): x is typeof Skipped => x === Skipped;
  export const isNotSkipped = <T>(x: T | typeof Skipped): x is T => !isSkipped(x);

  export const isExhausted = <T>(x: T | typeof Exhausted): x is typeof Exhausted => x === Exhausted;
  export const isNotExhausted = <T>(x: T | typeof Exhausted): x is T => !isExhausted(x);

  export const isAccepted = <T>(specimen: Specimen<T>): specimen is T =>
    isNotSkipped(specimen) && isNotExhausted(specimen);

  export const map = <T, U>(f: (x: T) => U, specimen: Specimen<T>): Specimen<U> =>
    isAccepted(specimen) ? f(specimen) : specimen;
}

export type Specimens<T> = Random<Specimen<RoseTree<T>>>;

namespace Specimens {
  const generatorForEach = <T>(generator: Generator<T>, action: (x: T) => void): void => {
    while (true) {
      const next = generator.next();

      if (next.done) {
        return;
      }

      action(next.value);
    }
  };

  export const exhausted = <T>(): Specimens<T> => () => Sequence.singleton(Exhausted);

  export const constant = <T>(x: T): Specimens<T> => () => Sequence.singleton(RoseTree.singleton(x));

  export const map = <T, U>(f: (x: T) => U, d: Specimens<T>): Specimens<U> =>
    Random.map((x) => (Specimen.isAccepted(x) ? RoseTree.map(f, x) : x), d);

  // export const expand = <T, U>(fs: Array<(x: T) => U>, d: Data<T>): Data<U> =>
  //   Random.expand(function* (x) {
  //     if (isHit(x)) {
  //       yield* RoseTree.expand(fs, x);
  //     }
  //   }, d);

  export const filter = <T>(pred: (x: T) => boolean, d: Specimens<T>): Specimens<T> =>
    Random.expand(function* (x) {
      yield x;

      // const expanded = missableToSequence(x).bind((t) => RoseTree.filter(pred, t));
      // if (expanded.isEmpty()) {
      //   yield Miss;
      // } else {
      //   yield* expanded;
      // }

      // if (isHit(x)) {
      //   const trees = RoseTree.filter(pred, x);
      //   if (trees.isEmpty()) {
      //     yield Miss;
      //   } else {
      //     yield* trees;
      //   }
      // } else {
      //   yield Miss;
      // }
    }, d);

  export const integral = <N>(numeric: Numeric<N>, range: Range<N>): Specimens<N> => {
    const r: Random<N> = Random.integral(numeric, range);
    const shrink = Shrink.towards(numeric, range.origin);
    const f = (x: N): RoseTree<N> => [x, shrink(x).map(RoseTree.singleton)];
    return Random.map(f, r);
  };

  export const integer = (range: Range<number>): Specimens<number> => integral(Integer, range);

  export const item = <T>(arr: Array<T>): Specimens<T> => {
    if (arr.length === 0) {
      return exhausted();
    }

    const range = IntegerRange.constant(0, arr.length - 1);
    return map((ix) => arr[ix], integer(range));
  };

  export const run = <T>(seed: Seed, size: Size, count: number, specimens: Specimens<T>): Generator<Specimen<T>> => {
    return Random.run(seed, size, specimens)
      .map((x) => (Specimen.isAccepted(x) ? RoseTree.outcome(x) : x))
      .take(count)
      .takeWhile((x) => x !== undefined)
      .toGenerator();
  };

  export const runAccepted = <T>(seed: Seed, size: Size, count: number, specimens: Specimens<T>): Generator<T> => {
    return Random.run(seed, size, specimens)
      .filter(Specimen.isAccepted)
      .map(RoseTree.outcome)
      .take(count)
      .takeWhile((x) => x !== undefined)
      .toGenerator();
  };

  export const sample = <T>(size: Size, count: number, specimens: Specimens<T>): Generator<Specimen<T>> =>
    run(Seed.spawn(), size, count, specimens);

  export const sampleAccepted = <T>(size: Size, count: number, specimens: Specimens<T>): Generator<T> =>
    runAccepted(Seed.spawn(), size, count, specimens);

  export const print = <T>(size: Size, count: number, specimens: Specimens<T>): void => {
    generatorForEach(sampleAccepted(size, count, specimens), (x) =>
      console.log(Specimen.isAccepted(x) ? x : 'SKIPPED'),
    );
  };
}

export class SpecimensBuilder<T> {
  constructor(private specimens: Specimens<T>) {}

  public map<U>(f: (x: T) => U): SpecimensBuilder<U> {
    return new SpecimensBuilder(Specimens.map(f, this.specimens));
  }

  public filter<U extends T>(pred: (x: T) => x is U): SpecimensBuilder<U>;
  public filter(pred: (x: T) => boolean): this;
  public filter(pred: (x: T) => boolean): this {
    return new SpecimensBuilder(Specimens.filter(pred, this.specimens)) as this;
  }

  public exhaust(seed: Seed, size: Size): Generator<T> {
    return this.specimens(seed, size)
      .filter(Specimen.isNotSkipped)
      .takeWhile(Specimen.isNotExhausted)
      .map(RoseTree.outcome)
      .toGenerator();
  }

  public sample(size: Size, count: number): Generator<Specimen<T>> {
    return Specimens.sample(size, count, this.specimens);
  }

  public sampleAccepted(size: Size, count: number): Generator<T> {
    return Specimens.sampleAccepted(size, count, this.specimens);
  }

  public print(size: Size, count: number): void {
    Specimens.print(size, count, this.specimens);
  }

  public run(seed: Seed, size: Size, count: number): Generator<Specimen<T>> {
    return Specimens.run(seed, size, count, this.specimens);
  }

  public runAccepted(seed: Seed, size: Size, count: number): Generator<T> {
    return Specimens.runAccepted(seed, size, count, this.specimens);
  }
}

export const integer = (range: Range<number>): SpecimensBuilder<number> =>
  new SpecimensBuilder(Specimens.integer(range));

export const item = <T>(arr: Array<T>): SpecimensBuilder<T> => new SpecimensBuilder(Specimens.item(arr));

// export const unfold = <T>(seed: T, unfolder: (prev: T) => Specimens<T> | undefined): SpecimensBuilder<T> => {};
