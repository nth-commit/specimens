import { SpecimensBuilder, Specimens as S } from './Specimens';
import { constant } from './Specimens.Primitives';
import { Random } from '../Random';
import Sequence from '../Sequence';

export const map2 = <T1, T2, U>(sx: S<T1>, sy: S<T2>, f: (x: T1, y: T2) => U): S<U> =>
  sx.bind((x) => sy.bind((y) => constant(f(x, y))));

export const map3 = <T1, T2, T3, U>(sx: S<T1>, sy: S<T2>, sz: S<T3>, f: (x: T1, y: T2, z: T3) => U): S<U> =>
  sx.bind((x) => sy.bind((y) => sz.bind((z) => constant(f(x, y, z)))));

export const map4 = <T1, T2, T3, T4, U>(
  sx: S<T1>,
  sy: S<T2>,
  sz: S<T3>,
  sw: S<T4>,
  f: (x: T1, y: T2, z: T3, w: T4) => U,
): S<U> => sx.bind((x) => sy.bind((y) => sz.bind((z) => sw.bind((w) => constant(f(x, y, z, w))))));

export const zip = <T1, T2>(sx: S<T1>, sy: S<T2>): S<[T1, T2]> => map2(sx, sy, (x, y) => [x, y]);

export const concat = <T>(sx: S<T>, sy: S<T>): S<T> =>
  new SpecimensBuilder(
    Random.from((seed, size) => {
      const [leftSeed, rightSeed] = seed.split();
      return Sequence.fromGenerator(function* () {
        yield* sx.run(leftSeed, size);
        yield* sy.run(rightSeed, size);
      });
    }),
  );
