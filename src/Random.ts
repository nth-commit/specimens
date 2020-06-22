import Seed from './Seed';
import Sequence from './Sequence';
import Range, { Size } from './Range';
import Numeric from './Numeric';

export type Random<T> = (seed: Seed, size: Size) => Sequence<T>;

export namespace Random {
  const makeNextSeed = (seed: Seed) => {
    let currentSeed = seed;
    return () => {
      const [seed0, seed1] = currentSeed.split();
      currentSeed = seed0;
      return seed1;
    };
  };

  export const run = <T>(seed: Seed, size: Size, r: Random<T>): Sequence<T> => r(seed, size);

  export const integral = <N>(numeric: Numeric<N>, range: Range<N>): Random<N> => (seed, size) => {
    const [min, max] = range.getSizedBounds(size);
    const seedPrime = seed.clone();
    return Sequence.infinite().map(() => numeric.random(seedPrime, min, max));
  };

  export const map = <T, U>(f: (x: T) => U, r: Random<T>): Random<U> => (seed, size) => r(seed, size).map(f);

  export const mapSequence = <T, U>(f: (x: Sequence<T>) => Sequence<U>, r: Random<T>): Random<U> => (seed, size) =>
    f(r(seed, size));

  export const expand = <T, U>(f: (seed: Seed, size: Size, x: T) => Generator<U, void>, r: Random<T>): Random<U> => (
    seed,
    size,
  ) => {
    const nextSeed = makeNextSeed(seed);
    return Random.run(nextSeed(), size, r).expand(function* (x) {
      yield* f(nextSeed(), size, x);
    });
  };

  export const bind = <T, U>(f: (x: T) => Random<U>, r: Random<T>): Random<U> => (seed, size) => {
    const [s1, s2] = seed.split();
    const sequence = Random.run(s1, size, r);
    return sequence.bind((x) => Random.run(s2, size, f(x)));
  };

  export const replicate = <T>(n: number, r: Random<T>): Random<T> => (seed, size) => {
    let results = Sequence.empty<T>();
    let nextSeed = makeNextSeed(seed);

    for (let i = 0; i < n; i++) {
      results = results.append(run(nextSeed(), size, r));
    }

    return results;
  };

  export const replicateInfinite = <T>(r: Random<T>): Random<T> => (seed, size) => {
    const nextSeed = makeNextSeed(seed);
    return Sequence.infinite().bind(() => Random.run(nextSeed(), size, r));
  };
}

export default Random;
