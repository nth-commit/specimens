import Seed from './Seed';
import Sequence from './Sequence';
import Range, { Size } from './Range';
import Numeric from './Numeric';

export type Production<T> = [Seed, T];

export namespace Production {
  export const one = <T>(seed: Seed, x: T): Sequence<Production<T>> => Sequence.singleton([seed, x]);

  export const map = <T, U>([seed, x]: Production<T>, f: (x: T) => U): Production<U> => [seed, f(x)];
}

export type RandomF<T> = (seed: Seed, size: Size) => Sequence<Production<T>>;

export type Random<T> = {
  map<U>(f: (x: T) => U): Random<U>;
  bind<U>(f: (x: T) => Random<U>): Random<U>;
  spread<U>(f: (seed: Seed, size: Size) => (x: T) => Generator<Production<U>>): Random<U>;
  repeat(): Random<T>;
  run(seed: Seed, size: Size): Sequence<Production<T>>;
  toFunction(): RandomF<T>;
};

class RandomBuilder<T> implements Random<T> {
  constructor(readonly randomF: RandomF<T>) {}

  map<U>(f: (x: T) => U): RandomBuilder<U> {
    const { randomF } = this;
    return new RandomBuilder<U>((seed, size) => randomF(seed, size).map((p) => Production.map(p, f)));
  }

  bind<U>(f: (x: T) => RandomBuilder<U>): RandomBuilder<U> {
    const r = this;
    return new RandomBuilder<U>((seed, size) =>
      Sequence.fromGenerator(function* () {
        for (const [seedX, x] of r.run(seed, size)) {
          for (const [seedY, y] of f(x).run(seedX, size)) {
            yield* Production.one(seedY, y);
          }
        }
      }),
    );
  }

  spread<U>(f: (seed: Seed, size: Size) => (x: T) => Generator<Production<U>>): RandomBuilder<U> {
    const r = this;
    return new RandomBuilder<U>((seed, size) =>
      Sequence.fromGenerator(function* () {
        for (const [seedX, x] of r.run(seed, size)) {
          yield* f(seedX, size)(x);
        }
      }),
    );
  }

  repeat(): RandomBuilder<T> {
    const r = this;
    return new RandomBuilder<T>((seed, size) => {
      let currentSeed = seed;
      return Sequence.infinite()
        .bind(() => r.run(currentSeed, size))
        .tap(([seed]) => {
          currentSeed = seed;
        });
    });
  }

  run(seed: Seed, size: Size): Sequence<Production<T>> {
    return this.randomF(seed, size);
  }

  toFunction(): RandomF<T> {
    return this.randomF;
  }
}

export namespace Random {
  export const constant = <U>(x: U): Random<U> => new RandomBuilder((seed) => Production.one(seed, x));

  export const integral = <N>(numeric: Numeric<N>, range: Range<N>): Random<N> =>
    new RandomBuilder((seed, size) => {
      const [min, max] = range.getSizedBounds(size);
      const [leftSeed, rightSeed] = seed.split();
      return Production.one(leftSeed, numeric.random(rightSeed, min, max));
    });

  export const from = <T>(f: RandomF<T>): Random<T> => new RandomBuilder(f);
}
