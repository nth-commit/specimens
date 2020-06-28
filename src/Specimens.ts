import Numeric, { Integer } from './Numeric';
import Random, { Production } from './Random';
import RoseTree from './RoseTree';
import Sequence from './Sequence';
import Range, { Size, IntegerRange } from './Range';
import Shrink from './Shrink';
import Seed from './Seed';
import Specimen, { Exhausted, Skipped } from './Specimen';
import ExhaustionStrategy from './ExhaustionStrategy';

export type Specimens<T> = Random<Specimen<RoseTree<T>>>;

const id = <T>(x: T): T => x;

namespace Specimens {
  const singleton = <T>(x: Specimen<RoseTree<T>>): Specimens<T> => Random.constant(x);

  export const constant = <T>(x: T): Specimens<T> => singleton(RoseTree.singleton(x));

  export const exhausted = <T>(): Specimens<T> => singleton(Exhausted);

  export const bind = <T, U>(f: (x: T) => Specimens<U>, specimens: Specimens<T>): Specimens<U> =>
    Random.bind((s) => {
      if (Specimen.isAccepted(s)) {
        return f(RoseTree.outcome(s));
      } else {
        return singleton(s);
      }
    }, specimens);

  export const map = <T, U>(f: (x: T) => U, specimens: Specimens<T>): Specimens<U> =>
    Random.map((s) => Specimen.map((x) => RoseTree.map(f, x), s), specimens);

  export const zip = <T1, T2>(s1: Specimens<T1>, s2: Specimens<T2>): Specimens<[T1, T2]> =>
    bind((t1) => map((t2) => [t1, t2], s2), s1);

  const applyFilter = <T>(pred: (x: T) => boolean) => (specimen: Specimen<RoseTree<T>>): Specimen<RoseTree<T>> => {
    if (Specimen.isDiscarded(specimen)) {
      return specimen;
    }

    if (!pred(RoseTree.outcome(specimen))) {
      return Skipped;
    }

    return RoseTree.filterShrinks(pred, specimen);
  };

  export const filter = <T>(pred: (x: T) => boolean, specimens: Specimens<T>): Specimens<T> =>
    Random.spread(function* (seed, size, specimen) {
      // Starting with the current, create an infinite sequence of specimens so we can do our best to find one that
      // passes the predicate.
      const specimensReplicatedIndefinitely = Sequence.concat<[Seed, Specimen<RoseTree<T>>]>(
        Sequence.singleton([seed, specimen]),
        Random.run(seed, size, Random.repeat(specimens)),
      );

      yield* specimensReplicatedIndefinitely
        .map((x) => Production.map(applyFilter(pred), x))
        .takeWhileInclusive(Specimen.isDiscarded);
    }, specimens);

  export const create = <T>(r: Random<T>, shrinker: (x: T) => Sequence<T>): Specimens<T> => {
    const toTree = (x: T): RoseTree<T> => RoseTree.unfold(id, shrinker, x);
    return Random.map(toTree, r);
  };

  export const integral = <N>(numeric: Numeric<N>, range: Range<N>): Specimens<N> =>
    create(Random.integral(numeric, range), Shrink.towards(numeric, range.origin));

  export const integer = (range: Range<number>): Specimens<number> => integral(Integer, range);

  export const item = <T>(arr: Array<T>): Specimens<T> => {
    if (arr.length === 0) {
      return exhausted();
    }

    const range = IntegerRange.constant(0, arr.length - 1);
    return map((ix) => arr[ix], integer(range));
  };

  const generateTreeSpecimens = <T>(
    seed: Seed,
    size: Size,
    count: number,
    specimens: Specimens<T>,
  ): Sequence<Specimen<RoseTree<T>>> =>
    Random.run(seed, size, Random.repeat(specimens))
      .map(([, specimen]) => specimen)
      .expand(ExhaustionStrategy.apply(ExhaustionStrategy.followingConsecutiveSkips(10)))
      .takeWhileInclusive((specimen) => specimen !== Exhausted)
      .take(count);

  export const generateSpecimens = <T>(
    seed: Seed,
    size: Size,
    count: number,
    specimens: Specimens<T>,
  ): Sequence<T | typeof Skipped | typeof Exhausted> =>
    generateTreeSpecimens(seed, size, count, specimens).map((specimen) =>
      Specimen.map((x) => RoseTree.outcome(x), specimen),
    );

  export const generateTrees = <T>(
    seed: Seed,
    size: Size,
    count: number,
    specimens: Specimens<T>,
  ): Sequence<RoseTree<T>> => generateTreeSpecimens(seed, size, count, specimens).filter(Specimen.isAccepted);

  export const generate = <T>(seed: Seed, size: Size, count: number, specimens: Specimens<T>): Sequence<T> =>
    Sequence.from(generateSpecimens(seed, size, count, specimens)).filter(Specimen.isAccepted);

  export const sampleTree = <T>(size: Size, count: number, specimens: Specimens<T>): Iterable<RoseTree<T>> =>
    generateTrees(Seed.spawn(), size, count, specimens);
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

  public sample(size: Size, count: number): Iterable<T> {
    return Specimens.generate(Seed.spawn(), size, count, this.specimens);
  }

  public sampleTrees(size: Size, count: number): Iterable<RoseTree<T>> {
    return Specimens.generateTrees(Seed.spawn(), size, count, this.specimens);
  }

  public sampleSpecimens(size: Size, count: number): Iterable<T | typeof Skipped | typeof Exhausted> {
    return Specimens.generateSpecimens(Seed.spawn(), size, count, this.specimens);
  }

  public generate(seed: Seed, size: Size, count: number): Iterable<T> {
    return Specimens.generate(seed, size, count, this.specimens);
  }

  public generateTrees(seed: Seed, size: Size, count: number): Iterable<RoseTree<T>> {
    return Specimens.generateTrees(seed, size, count, this.specimens);
  }

  public generateSpecimens(seed: Seed, size: Size, count: number): Iterable<T | typeof Skipped | typeof Exhausted> {
    return Specimens.generateSpecimens(seed, size, count, this.specimens);
  }
}

export const create = <T>(r: Random<T>, shrinker: (x: T) => Sequence<T>): SpecimensBuilder<T> =>
  new SpecimensBuilder<T>(Specimens.create(r, shrinker));

export const createUnshrinkable = <T>(r: Random<T>): SpecimensBuilder<T> =>
  new SpecimensBuilder<T>(Specimens.create(r, () => Sequence.empty()));

export const constant = <T>(x: T) => new SpecimensBuilder(Specimens.constant(x));

export const integer = (range: Range<number>): SpecimensBuilder<number> =>
  new SpecimensBuilder(Specimens.integer(range));

export const item = <T>(arr: Array<T>): SpecimensBuilder<T> => new SpecimensBuilder(Specimens.item(arr));

export const zip = <T1, T2>(s1: SpecimensBuilder<T1>, s2: SpecimensBuilder<T2>): SpecimensBuilder<[T1, T2]> =>
  new SpecimensBuilder(Specimens.zip(s1.specimens, s2.specimens));

export const exhausted = <T>(): SpecimensBuilder<T> => new SpecimensBuilder(Specimens.exhausted());
