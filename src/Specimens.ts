import Numeric, { Integer } from './Numeric';
import Random from './Random';
import RoseTree from './RoseTree';
import Sequence from './Sequence';
import Range, { Size, IntegerRange } from './Range';
import Shrink from './Shrink';
import Seed from './Seed';
import Specimen, { Exhausted, Skipped } from './Specimen';
import ExhaustionStrategy from './ExhaustionStrategy';

const generatorForEach = <T>(generator: Generator<T>, action: (x: T) => void): void => {
  while (true) {
    const next = generator.next();

    if (next.done) {
      return;
    }

    action(next.value);
  }
};

export type Specimens<T> = Random<Specimen<T>>;

namespace Specimens {
  export const singleton = <T>(x: Specimen<T>): Specimens<T> => () => Sequence.singleton(x);

  export const constant = <T>(x: T): Specimens<T> => singleton(RoseTree.singleton(x));

  export const exhausted = <T>(): Specimens<T> => singleton(Exhausted);

  export const bind = <T, U>(f: (x: T) => Specimens<U>, s: Specimens<T>): Specimens<U> =>
    Random.bind((x) => (Specimen.isAccepted(x) ? f(RoseTree.outcome(x)) : singleton(x)), s);

  export const map = <T, U>(f: (x: T) => U, s: Specimens<T>): Specimens<U> => Random.map((x) => Specimen.map(f, x), s);

  export const zip = <T1, T2>(s1: Specimens<T1>, s2: Specimens<T2>): Specimens<[T1, T2]> =>
    bind((t1) => map((t2) => [t1, t2], s2), s1);

  // For each element in the sequence, yield infinitely until we find as many accepted outcomes that pass the
  // predicate. If the given specimens were already filtered through a hard predicate, this may spin for a
  // loooooooong time - but it's up to the enumerating code to control excessive rejections.
  export const filter = <T>(pred: (x: T) => boolean, specimens: Specimens<T>): Specimens<T> =>
    Random.expand(function* (seed, size, x) {
      yield* Random.run(seed, size, Random.replicateInfinite(specimens))
        .cons(x)
        .map((xPrime) => (Specimen.isAccepted(xPrime) && !pred(RoseTree.outcome(xPrime)) ? Skipped : xPrime))
        .takeWhile((xPrime) => !Specimen.isAccepted(xPrime), 1);
    }, specimens);

  export const integral = <N>(numeric: Numeric<N>, range: Range<N>): Specimens<N> => {
    const r: Random<N> = Random.integral(numeric, range);
    const shrink = Shrink.towards(numeric, range.origin);
    const f = (x: N): RoseTree<N> => [x, shrink(x).map(RoseTree.singleton)];
    return Random.mapSequence((seq) => seq.take(1), Random.map<N, Specimen<N>>(f, r));
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
    const replications = Random.replicate(count, specimens);
    return Random.run(seed, size, replications)
      .expand(ExhaustionStrategy.apply(ExhaustionStrategy.followingConsecutiveSkips(10)))
      .takeWhile(Specimen.isNotExhausted, 1) // Take the next 1 to include the Exhausted marker in the sequence.
      .take(count)
      .toGenerator();
  };

  export const runAccepted = <T>(seed: Seed, size: Size, count: number, specimens: Specimens<T>): Generator<T> => {
    const replications = Random.replicate(count, specimens);
    return Random.run(seed, size, replications)
      .expand(ExhaustionStrategy.apply(ExhaustionStrategy.followingConsecutiveSkips(10)))
      .takeWhile(Specimen.isNotExhausted)
      .filter(Specimen.isAccepted)
      .map(RoseTree.outcome)
      .take(count)
      .toGenerator();
  };

  export const sample = <T>(size: Size, count: number, specimens: Specimens<T>): Generator<Specimen<T>> =>
    run(Seed.spawn(), size, count, specimens);

  export const sampleAccepted = <T>(size: Size, count: number, specimens: Specimens<T>): Generator<T> =>
    runAccepted(Seed.spawn(), size, count, specimens);

  export const print = <T>(size: Size, count: number, specimens: Specimens<T>): void => {
    generatorForEach(sampleAccepted(size, count, specimens), (x) => console.log(x));
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

export const constant = <T>(x: T) => new SpecimensBuilder(Specimens.constant(x));

export const integer = (range: Range<number>): SpecimensBuilder<number> =>
  new SpecimensBuilder(Specimens.integer(range));

export const item = <T>(arr: Array<T>): SpecimensBuilder<T> => new SpecimensBuilder(Specimens.item(arr));

export const zip = <T1, T2>(s1: SpecimensBuilder<T1>, s2: SpecimensBuilder<T2>): SpecimensBuilder<[T1, T2]> =>
  new SpecimensBuilder(Specimens.zip(s1.specimens, s2.specimens));

// export const unfold = <T>(seed: T, unfolder: (prev: T) => Specimens<T> | undefined): SpecimensBuilder<T> => {};
