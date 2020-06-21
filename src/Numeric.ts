import Seed from './Seed';

export type Numeric<N> = {
  ZERO: N;
  ONE: N;
  add: (l: N, r: N) => N;
  sub: (l: N, r: N) => N;
  mul: (l: N, r: N) => N;
  div: (l: N, r: N) => N;
  eq: (l: N, r: N) => boolean;
  min: (x: N, y: N) => N;
  max: (x: N, y: N) => N;
  parse: (x: number) => N;
  random: (seed: Seed, min: N, max: N) => N;
};

export default Numeric;

export const Integer: Numeric<number> = {
  ZERO: 0,
  ONE: 1,
  add: (l, r) => l + r,
  sub: (l, r) => l - r,
  mul: (l, r) => Math.trunc(l * r),
  div: (l, r) => Math.trunc(l / r),
  eq: (l, r) => Math.trunc(l) === Math.trunc(r),
  min: Math.min,
  max: Math.max,
  parse: (x) => Math.trunc(x),
  random: (seed, min, max) => seed.nextInt(min, max),
};
