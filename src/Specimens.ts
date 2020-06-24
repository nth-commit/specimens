import Numeric, { Integer } from './Numeric';
import Random from './Random';
import RoseTree from './RoseTree';
import Sequence from './Sequence';
import Range, { Size, IntegerRange } from './Range';
import Shrink from './Shrink';
import Seed from './Seed';
import Specimen, { Exhausted, Skipped } from './Specimen';
import ExhaustionStrategy from './ExhaustionStrategy';

export type Specimens<T> = Random<Specimen<RoseTree<T>>>;

namespace Specimens {
  export const singleton = <T>(x: Specimen<RoseTree<T>>): Specimens<T> => () => Sequence.singleton(x);

  export const constant = <T>(x: T): Specimens<T> => singleton(RoseTree.singleton(x));

  export const exhausted = <T>(): Specimens<T> => singleton(Exhausted);

  export const bind = <T, U>(f: (x: T) => Specimens<U>, specimens: Specimens<T>): Specimens<U> =>
    Random.bind((x) => (Specimen.isAccepted(x) ? f(RoseTree.outcome(x)) : singleton(x)), specimens);

  export const map = <T, U>(f: (x: T) => U, specimens: Specimens<T>): Specimens<U> =>
    Random.map((s) => Specimen.map((x) => RoseTree.map(f, x), s), specimens);

  export const zip = <T1, T2>(s1: Specimens<T1>, s2: Specimens<T2>): Specimens<[T1, T2]> =>
    bind((t1) => map((t2) => [t1, t2], s2), s1);

  const applyFilter = <T>(pred: (x: T) => boolean) => (specimen: Specimen<RoseTree<T>>): Specimen<RoseTree<T>> =>
    Specimen.isAccepted(specimen) && !pred(RoseTree.outcome(specimen)) ? Skipped : specimen;

  export const filter = <T>(pred: (x: T) => boolean, specimens: Specimens<T>): Specimens<T> =>
    Random.spread(function* (seed, size, specimen) {
      if (Specimen.isDiscarded(specimen)) {
        // Specimen was discarded in a previous filter
        yield specimen;
        return;
      }

      // Starting with the current, create an infinite sequence of specimens so we can do our best to find one that
      // passes the predicate.
      const specimensReplicatedIndefinitely = Sequence.concat(
        Sequence.singleton(specimen),
        Random.run(seed, size, Random.repeat(specimens)),
      );

      yield* specimensReplicatedIndefinitely.map(applyFilter(pred)).takeWhileInclusive(Specimen.isDiscarded);
    }, specimens);

  export const integral = <N>(numeric: Numeric<N>, range: Range<N>): Specimens<N> => {
    const r: Random<N> = Random.integral(numeric, range);
    const shrink = Shrink.towards(numeric, range.origin);
    const f = (x: N): RoseTree<N> => [x, shrink(x).map(RoseTree.singleton)];
    return Random.mapSequence((seq) => seq.take(1), Random.map<N, Specimen<RoseTree<N>>>(f, r));
  };

  export const integer = (range: Range<number>): Specimens<number> => integral(Integer, range);

  export const item = <T>(arr: Array<T>): Specimens<T> => {
    if (arr.length === 0) {
      return exhausted();
    }

    const range = IntegerRange.constant(0, arr.length - 1);
    return map((ix) => arr[ix], integer(range));
  };

  export const run = <T>(
    seed: Seed,
    size: Size,
    count: number,
    specimens: Specimens<T>,
  ): Iterable<T | typeof Skipped | typeof Exhausted> =>
    Random.run(seed, size, Random.repeat(specimens))
      .expand(ExhaustionStrategy.apply(ExhaustionStrategy.followingConsecutiveSkips(10)))
      .takeWhileInclusive((x) => Specimen.isNotExhausted(x))
      .map((x) => (Specimen.isAccepted(x) ? RoseTree.outcome(x) : x))
      .take(count);

  export const runAccepted = <T>(seed: Seed, size: Size, count: number, specimens: Specimens<T>): Iterable<T> =>
    Random.run(seed, size, Random.repeat(specimens))
      .expand(ExhaustionStrategy.apply(ExhaustionStrategy.followingConsecutiveSkips(10)))
      .takeWhile(Specimen.isNotExhausted)
      .filter(Specimen.isAccepted)
      .map(RoseTree.outcome)
      .take(count);

  export const sample = <T>(
    size: Size,
    count: number,
    specimens: Specimens<T>,
  ): Iterable<T | typeof Skipped | typeof Exhausted> => run(Seed.spawn(), size, count, specimens);

  export const sampleAccepted = <T>(size: Size, count: number, specimens: Specimens<T>): Iterable<T> =>
    runAccepted(Seed.spawn(), size, count, specimens);

  export const print = <T>(size: Size, count: number, specimens: Specimens<T>): void => {
    for (const x of sampleAccepted(size, count, specimens)) {
      console.log(x);
    }
  };
}

export class SpecimensBuilder<T> {
  constructor(public specimens: Specimens<T>) {}

  public bind<U>(f: (x: T) => SpecimensBuilder<U>): SpecimensBuilder<U> {
    return new SpecimensBuilder(Specimens.bind((x) => f(x).specimens, this.specimens));
  }

  public map<U>(f: (x: T) => U): SpecimensBuilder<U> {
    return new SpecimensBuilder(Specimens.map(f, this.specimens));
  }

  public filter<U extends T>(pred: (x: T) => x is U): SpecimensBuilder<U>;
  public filter(pred: (x: T) => boolean): this;
  public filter(pred: (x: T) => boolean): this {
    return new SpecimensBuilder(Specimens.filter(pred, this.specimens)) as this;
  }

  public sample(size: Size, count: number): Iterable<T | typeof Skipped | typeof Exhausted> {
    return Specimens.sample(size, count, this.specimens);
  }

  public sampleAccepted(size: Size, count: number): Iterable<T> {
    return Specimens.sampleAccepted(size, count, this.specimens);
  }

  public print(size: Size, count: number): void {
    Specimens.print(size, count, this.specimens);
  }

  public run(seed: Seed, size: Size, count: number): Iterable<T | typeof Skipped | typeof Exhausted> {
    return Specimens.run(seed, size, count, this.specimens);
  }

  public runAccepted(seed: Seed, size: Size, count: number): Iterable<T> {
    return Specimens.runAccepted(seed, size, count, this.specimens);
  }
}

export const constant = <T>(x: T) => new SpecimensBuilder(Specimens.constant(x));

export const integer = (range: Range<number>): SpecimensBuilder<number> =>
  new SpecimensBuilder(Specimens.integer(range));

export const item = <T>(arr: Array<T>): SpecimensBuilder<T> => new SpecimensBuilder(Specimens.item(arr));

export const zip = <T1, T2>(s1: SpecimensBuilder<T1>, s2: SpecimensBuilder<T2>): SpecimensBuilder<[T1, T2]> =>
  new SpecimensBuilder(Specimens.zip(s1.specimens, s2.specimens));

// export const unfold = <T>(seed: T, unfolder: (prev: T) => Specimens<T> | undefined): SpecimensBuilder<T> => {};
