import Seed from './Seed';
import Sequence from './Sequence';
import Range, { Size } from './Range';
import Numeric from './Numeric';

export type Production<T> = [Seed, T];

export namespace Production {
  export const one = <T>(seed: Seed, x: T): Sequence<Production<T>> => Sequence.singleton([seed, x]);

  export const map = <T, U>(f: (x: T) => U, [seed, x]: Production<T>): Production<U> => [seed, f(x)];
}

export type Random<T> = (seed: Seed, size: Size) => Sequence<Production<T>>;

export namespace Random {
  export const run = <T>(seed: Seed, size: Size, r: Random<T>): Sequence<[Seed, T]> => r(seed, size);

  export const map = <T, U>(f: (x: T) => U, r: Random<T>): Random<U> => (seed, size) =>
    r(seed, size).map((p) => Production.map(f, p));

  export const bind = <T, U>(f: (x: T) => Random<U>, r: Random<T>): Random<U> => (seed, size) => {
    return Sequence.fromGenerator(function* () {
      for (const [seedX, x] of Random.run(seed, size, r)) {
        for (const [seedY, y] of Random.run(seedX, size, f(x))) {
          yield* Production.one(seedY, y);
        }
      }
    });
  };

  export const spread = <T, U>(
    f: (seed: Seed, size: Size, x: T) => Generator<Production<U>>,
    r: Random<T>,
  ): Random<U> => (seed, size) => {
    return Sequence.fromGenerator(function* () {
      for (const [seedX, x] of Random.run(seed, size, r)) {
        yield* f(seedX, size, x);
      }
    });
  };

  export const constant = <T>(x: T): Random<T> => (seed) => Production.one(seed, x);

  export const integral = <N>(numeric: Numeric<N>, range: Range<N>): Random<N> => (seed, size) => {
    const [min, max] = range.getSizedBounds(size);
    const [leftSeed, rightSeed] = seed.split();
    return Production.one(leftSeed, numeric.random(rightSeed, min, max));
  };

  export const repeat = <T>(r: Random<T>): Random<T> => (seed, size) => {
    let currentSeed = seed;
    return Sequence.infinite()
      .bind(() => run(currentSeed, size, r))
      .tap(([seed]) => {
        currentSeed = seed;
      });
  };
}

export default Random;
