import Numeric, { Integer } from './Numeric';
import { Random, Production } from './Random';
import Sequence from './Sequence';
import Range, { Size, IntegerRange } from './Range';
import Shrink from './Shrink';
import Seed from './Seed';
import { RoseTree as Tree } from './RoseTree';
import { Specimen } from './Specimen';
import ExhaustionStrategy, { Exhausted } from './ExhaustionStrategy';
import { SpecimenTree } from './SpecimenTree';

export type MaybeExhaustedSpecimen<T> = Specimen<T> | typeof Exhausted;

type ProducedSpecimenTree<T> = Production<SpecimenTree<T>>;

namespace ProducedSpecimenTree {
  export const bindTree = <T, U>(p: ProducedSpecimenTree<T>, k: (x: T) => SpecimenTree<U>): ProducedSpecimenTree<U> =>
    Production.map(p, (t) => SpecimenTree.bind(t, k));
}

export type Specimens<T> = {
  run(seed: Seed, size: Size): Sequence<ProducedSpecimenTree<T>>;
  map<U>(f: (x: T) => U): Specimens<U>;
  bind<U>(f: (x: T) => Specimens<U>): Specimens<U>;
  filter(pred: (x: T) => boolean): Specimens<T>;
  generateSpecimens(seed: Seed, size: Size, count: number): Sequence<MaybeExhaustedSpecimen<T>>;
  generateTrees(seed: Seed, size: Size, count: number): Sequence<Tree<T>>;
  generate(seed: Seed, size: Size, count: number): Sequence<T>;
  sampleSpecimens(size: Size, count: number): Sequence<MaybeExhaustedSpecimen<T>>;
  sampleTrees(size: Size, count: number): Sequence<Tree<T>>;
  sample(size: Size, count: number): Sequence<T>;
};

class SpecimensBuilder<T> implements Specimens<T> {
  constructor(readonly random: Random<SpecimenTree<T>>) {}

  run(seed: Seed, size: Size): Sequence<ProducedSpecimenTree<T>> {
    return this.random.run(seed, size);
  }

  // About transforming specimens

  map<U>(f: (x: T) => U): Specimens<U> {
    return new SpecimensBuilder<U>(this.random.map((specimenTree) => SpecimenTree.map(specimenTree, f)));
  }

  bind<U>(f: (x: T) => Specimens<U>): Specimens<U> {
    const r = this.random.spread(
      (seed, size) =>
        function* (specimenTree) {
          if (SpecimenTree.isAccepted(specimenTree) === false) {
            yield* Production.one(seed, SpecimenTree.rejected<U>());
            return;
          }

          let currentSeed = seed;
          const run = <V>(specimens: Specimens<V>) => {
            return specimens
              .run(currentSeed, size)
              .tap(([s]) => {
                currentSeed = s;
              })
              .map(([, x]) => x);
          };

          const specimenTree0 = SpecimenTree.bind<T, U>(specimenTree, (x) => {
            const specimenTrees = run(f(x));

            const specimenTree1 = specimenTrees.first();
            if (specimenTree1 === undefined) {
              throw 'TODO: Handle empty bound sequence';
            }

            if (specimenTrees.first()) {
              throw 'TODO: Handle sequences > 1';
            }

            return specimenTree1;
          });

          yield* Production.one(currentSeed, specimenTree0);
        },
    );

    return new SpecimensBuilder<U>(r);
  }

  filter(pred: (x: T) => boolean): Specimens<T> {
    const { random } = this;
    return new SpecimensBuilder<T>(
      random.spread(
        (seed, size) =>
          function* (specimenTree) {
            // If it's already been rejected, don't try and expand the sequence to find an acceptable value. We might
            // have even moved on from this seed already if so (and will just be covering the same ground again).
            if (SpecimenTree.isAccepted(specimenTree) === false) {
              yield* Production.one(seed, specimenTree);
              return;
            }

            // Starting with the current, create an infinite sequence of specimens so we can do our best to find one that
            // passes the predicate.
            const specimensReplicatedIndefinitely = Sequence.concat<[Seed, SpecimenTree<T>]>(
              Sequence.singleton([seed, specimenTree]),
              random.repeat().run(seed, size),
            );

            yield* specimensReplicatedIndefinitely
              .map((p) =>
                ProducedSpecimenTree.bindTree(p, (x) =>
                  pred(x) ? SpecimenTree.accepted(x) : SpecimenTree.rejected<T>(),
                ),
              )
              .takeWhileInclusive(([, x]) => SpecimenTree.isAccepted(x) === false);
          },
      ),
    );
  }

  // About iterating over specimens

  private generateTreeSpecimens(seed: Seed, size: Size, count: number): Sequence<SpecimenTree<T> | typeof Exhausted> {
    return this.random
      .repeat()
      .run(seed, size)
      .map(([, tree]) => tree)
      .expand(ExhaustionStrategy.apply(ExhaustionStrategy.followingConsecutiveSkips(10)))
      .takeWhileInclusive((x) => x !== Exhausted)
      .take(count);
  }

  generateTrees(seed: Seed, size: Size, count: number): Sequence<Tree<T>> {
    const isNotExhausted = <T>(x: T | typeof Exhausted): x is T => x !== Exhausted;
    const isNotUndefined = <T>(x: T | undefined): x is T => x !== undefined;
    return this.generateTreeSpecimens(seed, size, count)
      .filter(isNotExhausted)
      .map(SpecimenTree.toMaybeTree)
      .filter(isNotUndefined);
  }

  generateSpecimens(seed: Seed, size: Size, count: number): Sequence<MaybeExhaustedSpecimen<T>> {
    return this.generateTreeSpecimens(seed, size, count).map((x) =>
      x === Exhausted ? x : SpecimenTree.specimenOutcome(x),
    );
  }

  generate(seed: Seed, size: Size, count: number): Sequence<T> {
    return this.generateTrees(seed, size, count).map(Tree.outcome);
  }

  sampleTrees(size: Size, count: number): Sequence<Tree<T>> {
    return this.generateTrees(Seed.spawn(), size, count);
  }

  sampleSpecimens(size: Size, count: number): Sequence<MaybeExhaustedSpecimen<T>> {
    return this.generateSpecimens(Seed.spawn(), size, count);
  }

  sample(size: Size, count: number): Sequence<T> {
    return this.generate(Seed.spawn(), size, count);
  }
}

export namespace Specimens {
  const singleton = <T>(x: SpecimenTree<T>): Specimens<T> => new SpecimensBuilder(Random.constant(x));

  export const rejected = <T>(): Specimens<T> => singleton(SpecimenTree.rejected());

  export const create = <T>(r: Random<T>, shrinker: (x: T) => Sequence<T>): Specimens<T> =>
    new SpecimensBuilder<T>(r.map((x) => SpecimenTree.unfold(Specimen.accepted, shrinker, x)));

  export const constant = <T>(x: T): Specimens<T> =>
    singleton(SpecimenTree.unfold(Specimen.accepted, Shrink.none(), x));

  export const infinite = <T>(x: T): Specimens<T> => create(Random.infinite(x), Shrink.none());

  export const integral = <N>(numeric: Numeric<N>, range: Range<N>): Specimens<N> =>
    create(Random.integral(numeric, range), Shrink.towards(numeric, range.origin));

  export const integer = (range: Range<number>): Specimens<number> => integral(Integer, range);

  export const item = <T>(arr: Array<T>): Specimens<T> => {
    if (arr.length === 0) {
      return rejected();
    }

    const range = IntegerRange.constant(0, arr.length - 1);
    return integer(range).map((ix) => arr[ix]);
  };

  export const zip = <T1, T2>(s1: Specimens<T1>, s2: Specimens<T2>): Specimens<[T1, T2]> =>
    s1.bind((t1) =>
      s2.map((t2) => {
        return [t1, t2];
      }),
    );
}
