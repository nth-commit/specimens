import Seed from './Seed';
import Sequence from './Sequence';
import Range, { Size } from './Range';
import Numeric from './Numeric';

export type RandomF<T> = (seed: Seed, size: Size) => Sequence<T>;

export type Random<T> = {
  map<U>(f: (x: T) => U): Random<U>;
  expand<U>(f: (seed: Seed, size: Size, x: T) => Sequence<U>): Random<U>;
  repeat(): Random<T>;
  run(seed: Seed, size: Size): Sequence<T>;
};

class RandomBuilder<T> implements Random<T> {
  constructor(readonly randomF: RandomF<T>) {}

  map<U>(f: (x: T) => U): RandomBuilder<U> {
    const { randomF } = this;
    return new RandomBuilder<U>((seed, size) => randomF(seed, size).map(f));
  }

  expand<U>(f: (seed: Seed, size: Size, x: T) => Sequence<U>): RandomBuilder<U> {
    const r = this;
    return new RandomBuilder<U>((seed, size) =>
      Sequence.fromGenerator(function* () {
        const [leftSeed, rightSeed] = seed.split();
        for (const x of r.run(leftSeed, size)) {
          yield* f(rightSeed, size, x);
        }
      }),
    );
  }

  repeat(): RandomBuilder<T> {
    const r = this;
    return new RandomBuilder<T>((seed, size) => {
      let currentSeed = seed;
      return Sequence.infinite().bind(() => {
        const [leftSeed, rightSeed] = currentSeed.split();
        currentSeed = leftSeed;
        return r.run(rightSeed, size);
      });
    });
  }

  run(seed: Seed, size: Size): Sequence<T> {
    return this.randomF(seed, size);
  }
}

export namespace Random {
  export const sequence = <T>(xs: T[]): Random<T> => new RandomBuilder(() => Sequence.from(xs));

  export const constant = <T>(x: T): Random<T> => new RandomBuilder(() => Sequence.singleton(x));

  export const integral = <N>(numeric: Numeric<N>, range: Range<N>): Random<N> =>
    new RandomBuilder((seed, size) => {
      const [min, max] = range.getSizedBounds(size);
      return Sequence.singleton(numeric.random(seed, min, max));
    });

  export const from = <T>(f: RandomF<T>): Random<T> => new RandomBuilder(f);

  export const infinite = <U>(x: U): Random<U> => from(() => Sequence.infinite().bind(() => Sequence.singleton(x)));
}
