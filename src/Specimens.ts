import Numeric, { Integer } from './Numeric';
import { Random, Production, RandomF } from './Random';
import RoseTree from './RoseTree';
import Sequence from './Sequence';
import Range, { Size, IntegerRange } from './Range';
import Shrink from './Shrink';
import Seed from './Seed';
import Specimen, { Exhausted, Skipped } from './Specimen';
import ExhaustionStrategy from './ExhaustionStrategy';

const id = <T>(x: T): T => x;

const applyFilter = <T>(f: (x: T) => boolean) => (specimen: Specimen<RoseTree<T>>): Specimen<RoseTree<T>> => {
  if (Specimen.isDiscarded(specimen)) {
    return specimen;
  }

  if (!f(RoseTree.outcome(specimen))) {
    return Skipped;
  }

  return RoseTree.filterShrinks(f, specimen);
};

export type Specimens<T> = {
  map<U>(f: (x: T) => U): Specimens<U>;
  bind<U>(f: (x: T) => Specimens<U>): Specimens<U>;
  filter(f: (x: T) => boolean): Specimens<T>;
  generateSpecimens(seed: Seed, size: Size, count: number): Sequence<T | typeof Skipped | typeof Exhausted>;
  generateTrees(seed: Seed, size: Size, count: number): Sequence<RoseTree<T>>;
  generate(seed: Seed, size: Size, count: number): Sequence<T>;
  sampleSpecimens(size: Size, count: number): Sequence<T | typeof Skipped | typeof Exhausted>;
  sampleTrees(size: Size, count: number): Sequence<RoseTree<T>>;
  sample(size: Size, count: number): Sequence<T>;
};

class SpecimensBuilder<T> implements Specimens<T> {
  constructor(readonly random: Random<Specimen<RoseTree<T>>>) {}

  // About transforming specimens

  map<U>(f: (x: T) => U): SpecimensBuilder<U> {
    return new SpecimensBuilder<U>(this.random.map((s) => Specimen.map((x) => RoseTree.map(f, x), s)));
  }

  bind<U>(f: (x: T) => SpecimensBuilder<U>): SpecimensBuilder<U> {
    return new SpecimensBuilder<U>(
      this.random.bind((specimen) => {
        if (Specimen.isAccepted(specimen)) {
          return f(RoseTree.outcome(specimen)).random;
        } else {
          return Random.constant(specimen);
        }
      }),
    );
  }

  filter(f: (x: T) => boolean): SpecimensBuilder<T> {
    const { random } = this;
    return new SpecimensBuilder(
      random.spread(function* (seed, size, specimen) {
        // Starting with the current, create an infinite sequence of specimens so we can do our best to find one that
        // passes the predicate.
        const specimensReplicatedIndefinitely = Sequence.concat<[Seed, Specimen<RoseTree<T>>]>(
          Sequence.singleton([seed, specimen]),
          random.repeat().run(seed, size),
        );

        yield* specimensReplicatedIndefinitely
          .map((x) => Production.map(applyFilter(f), x))
          .takeWhileInclusive(Specimen.isDiscarded);
      }),
    );
  }

  // About iterating over specimens

  private generateTreeSpecimens(seed: Seed, size: Size, count: number): Sequence<Specimen<RoseTree<T>>> {
    return this.random
      .repeat()
      .run(seed, size)
      .map(([, specimen]) => specimen)
      .expand(ExhaustionStrategy.apply(ExhaustionStrategy.followingConsecutiveSkips(10)))
      .takeWhileInclusive((specimen) => specimen !== Exhausted)
      .take(count);
  }

  generateSpecimens(seed: Seed, size: Size, count: number): Sequence<T | typeof Skipped | typeof Exhausted> {
    return this.generateTreeSpecimens(seed, size, count).map((specimen) =>
      Specimen.map((x) => RoseTree.outcome(x), specimen),
    );
  }

  generateTrees(seed: Seed, size: Size, count: number): Sequence<RoseTree<T>> {
    return this.generateTreeSpecimens(seed, size, count).filter(Specimen.isAccepted);
  }

  generate(seed: Seed, size: Size, count: number): Sequence<T> {
    return this.generateSpecimens(seed, size, count).filter(Specimen.isAccepted);
  }

  sampleSpecimens(size: Size, count: number): Sequence<T | typeof Skipped | typeof Exhausted> {
    return this.generateSpecimens(Seed.spawn(), size, count);
  }

  sampleTrees(size: Size, count: number): Sequence<RoseTree<T>> {
    return this.generateTrees(Seed.spawn(), size, count);
  }

  sample(size: Size, count: number): Sequence<T> {
    return this.generate(Seed.spawn(), size, count);
  }
}

export namespace Specimens {
  const singleton = <T>(x: Specimen<RoseTree<T>>): Specimens<T> => new SpecimensBuilder(Random.constant(x));

  export const constant = <T>(x: T): Specimens<T> => singleton(RoseTree.singleton(x));

  export const exhausted = <T>(): Specimens<T> => singleton(Exhausted);

  export const create = <T>(f: RandomF<T>, shrinker: (x: T) => Sequence<T>): Specimens<T> => {
    const toTree = (x: T): RoseTree<T> => RoseTree.unfold(id, shrinker, x);
    return new SpecimensBuilder<T>(Random.from(f).map(toTree));
  };

  export const createUnshrinkable = <T>(f: RandomF<T>): Specimens<T> => create(f, () => Sequence.empty());

  export const integral = <N>(numeric: Numeric<N>, range: Range<N>): Specimens<N> =>
    create(Random.integral(numeric, range).toFunction(), Shrink.towards(numeric, range.origin));

  export const integer = (range: Range<number>): Specimens<number> => integral(Integer, range);

  export const item = <T>(arr: Array<T>): Specimens<T> => {
    if (arr.length === 0) {
      return exhausted();
    }

    const range = IntegerRange.constant(0, arr.length - 1);
    return integer(range).map((ix) => arr[ix]);
  };

  export const zip = <T1, T2>(s1: Specimens<T1>, s2: Specimens<T2>): Specimens<[T1, T2]> =>
    s1.bind((t1) => s2.map((t2) => [t1, t2]));
}
