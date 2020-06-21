import Seed from './Seed';
import Sequence from './Sequence';
import Range, { Size } from './Range';
import Numeric from './Numeric';

export type Random<T> = (seed: Seed, size: Size) => Sequence<T>;

export namespace Random {
  export const run = <T>(seed: Seed, size: Size, r: Random<T>): Sequence<T> => r(seed, size);

  export const integral = <N>(numeric: Numeric<N>, range: Range<N>): Random<N> => (seed, size) => {
    const [min, max] = range.getSizedBounds(size);
    const seedPrime = seed.clone();
    return Sequence.infinite().map(() => numeric.random(seedPrime, min, max));
  };

  export const map = <T, U>(f: (x: T) => U, r: Random<T>): Random<U> => (seed, size) => r(seed, size).map(f);

  export const expand = <T, U>(f: (x: T) => Generator<U, void>, r: Random<T>): Random<U> => (seed, size) =>
    r(seed, size).expand(f);
}

export default Random;
