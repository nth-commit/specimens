import Numeric, { Integer } from './Numeric';
import { Random } from './Random';
import Sequence from './Sequence';
import Range, { Size, IntegerRange } from './Range';
import Shrink from './Shrink';
import Seed from './Seed';
import { Tree } from './Tree';
import { Specimen } from './Specimen';
import ExhaustionStrategy, { Exhausted } from './ExhaustionStrategy';

export type MaybeExhaustedSpecimen<T> = Specimen<T> | typeof Exhausted;

export type Specimens<T> = {
  run(seed: Seed, size: Size): Sequence<Specimen<Tree<T>>>;
  map<U>(f: (x: T) => U): Specimens<U>;
  bind<U>(f: (x: T) => Specimens<U>): Specimens<U>;
  filter(pred: (x: T) => boolean): Specimens<T>;
  noShrink(): Specimens<T>;
  generateSpecimens(seed: Seed, size: Size, count: number): Sequence<MaybeExhaustedSpecimen<T>>;
  generateTrees(seed: Seed, size: Size, count: number): Sequence<Tree<T>>;
  generate(seed: Seed, size: Size, count: number): Sequence<T>;
  sampleSpecimens(size: Size, count: number): Sequence<MaybeExhaustedSpecimen<T>>;
  sampleTrees(size: Size, count: number): Sequence<Tree<T>>;
  sample(size: Size, count: number): Sequence<T>;
};

const id = <T>(x: T): T => x;

class SpecimensBuilder<T> implements Specimens<T> {
  constructor(readonly random: Random<Specimen<Tree<T>>>) {}

  run(seed: Seed, size: Size): Sequence<Specimen<Tree<T>>> {
    return this.random.run(seed, size);
  }

  // About transforming specimens

  map<U>(f: (x: T) => U): Specimens<U> {
    return new SpecimensBuilder<U>(
      this.random.map((treeSpecimen) => Specimen.map(treeSpecimen, (tree) => Tree.map(tree, f))),
    );
  }

  bind<U>(f: (x: T) => Specimens<U>): Specimens<U> {
    return new SpecimensBuilder(
      this.random.expand((seed, size, specimen) => {
        if (Specimen.isRejected(specimen)) {
          return Sequence.singleton(specimen);
        }

        type BoundSpecimens = Sequence<Specimen<Tree<U>>>;
        return Tree.fold<T, BoundSpecimens, BoundSpecimens>(
          specimen.value,
          (x, boundSpecimens) => {
            const ys0 = boundSpecimens.filter(Specimen.isAccepted).map(Specimen.getValue);
            return f(x)
              .run(seed, size)
              .map((specimen0) => Specimen.map(specimen0, ([y, ys1]) => Tree.create(y, Sequence.concat(ys1, ys0))));
          },
          (xs) => xs.bind(id),
        );
      }),
    );
  }

  filter(pred: (x: T) => boolean): Specimens<T> {
    const { random } = this;

    return new SpecimensBuilder(
      random.expand(
        (seed, size, treeSpecimen): Sequence<Specimen<Tree<T>>> => {
          if (Specimen.isRejected(treeSpecimen)) {
            return Sequence.singleton(treeSpecimen);
          }

          const specimensReplicatedIndefinitely = Sequence.concat<Specimen<Tree<T>>>(
            Sequence.singleton(treeSpecimen),
            random.repeat().run(seed, size),
          );

          return specimensReplicatedIndefinitely
            .map((treeSpecimen0) =>
              Specimen.bind(treeSpecimen0, ([x, xs]) =>
                pred(x) ? Specimen.accepted(Tree.create(x, Tree.filterForest(xs, pred))) : Specimen.rejected<Tree<T>>(),
              ),
            )
            .takeWhileInclusive((x) => Specimen.isAccepted(x) === false);
        },
      ),
    );
  }

  noShrink(): Specimens<T> {
    return new SpecimensBuilder<T>(
      this.random.map((treeSpecimen) => Specimen.map(treeSpecimen, ([x]) => Tree.singleton(x))),
    );
  }

  // About iterating over specimens

  private generateTreeSpecimens(seed: Seed, size: Size, count: number): Sequence<MaybeExhaustedSpecimen<Tree<T>>> {
    return this.random
      .repeat()
      .run(seed, size)
      .expand(ExhaustionStrategy.apply(ExhaustionStrategy.followingConsecutiveSkips(10)))
      .takeWhileInclusive((x) => x !== Exhausted)
      .take(count);
  }

  generateTrees(seed: Seed, size: Size, count: number): Sequence<Tree<T>> {
    const isNotExhausted = <T>(x: T | typeof Exhausted): x is T => x !== Exhausted;
    return this.generateTreeSpecimens(seed, size, count)
      .filter(isNotExhausted)
      .filter(Specimen.isAccepted)
      .map(Specimen.getValue);
  }

  generateSpecimens(seed: Seed, size: Size, count: number): Sequence<MaybeExhaustedSpecimen<T>> {
    return this.generateTreeSpecimens(seed, size, count).map((x) =>
      x === Exhausted ? x : Specimen.map(x, Tree.outcome),
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
  export const create = <T>(r: Random<T>, shrinker: (x: T) => Sequence<T>): Specimens<T> =>
    new SpecimensBuilder<T>(r.map((x) => Specimen.accepted(Tree.unfold(id, shrinker, x))));

  export const rejected = <T>(): Specimens<T> => new SpecimensBuilder(Random.constant(Specimen.rejected()));

  export const constant = <T>(x: T): Specimens<T> => create(Random.constant(x), Shrink.none());

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

  export const map2 = <T1, T2, U>(sx: Specimens<T1>, sy: Specimens<T2>, f: (x: T1, y: T2) => U): Specimens<U> =>
    sx.bind((x) => sy.bind((y) => constant(f(x, y))));

  export const zip = <T1, T2>(sx: Specimens<T1>, sy: Specimens<T2>): Specimens<[T1, T2]> =>
    map2(sx, sy, (x, y) => [x, y]);

  export const concat = <T>(sx: Specimens<T>, sy: Specimens<T>): Specimens<T> =>
    new SpecimensBuilder(
      Random.from((seed, size) => {
        const [leftSeed, rightSeed] = seed.split();
        return Sequence.fromGenerator(function* () {
          yield* sx.run(leftSeed, size);
          yield* sy.run(rightSeed, size);
        });
      }),
    );

  export const unfold = <T>(init: T, generator: (prev: T) => Specimens<T>): Specimens<T> =>
    generator(init).bind((x) => concat(Specimens.constant(x), unfold(x, generator)));
}
