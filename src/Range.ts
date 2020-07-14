import Numeric, { integerNumeric } from './Numeric';

export type Size = number;

export type Range<T> = { origin: T; getSizedBounds: (size: Size) => [T, T] };

export type RangeFactory<N> = {
  bounds: (size: Size, range: Range<N>) => [N, N];
  constant: (min: N, max: N) => Range<N>;
  linear: (min: N, max: N) => Range<N>;
};

const clamp = <N>(numeric: Numeric<N>, x: N, y: N, n: N): N =>
  x > y ? numeric.min(x, numeric.max(y, n)) : numeric.min(y, numeric.max(x, n));

const scaleLinear = <N>(numeric: Numeric<N>, size: Size, origin: N, n: N): N => {
  const maxSize = numeric.parse(99);
  const currentSize = numeric.parse(size);
  const clampedSize = clamp(numeric, numeric.ZERO, maxSize, currentSize);
  const distanceFromOrigin = numeric.sub(n, origin);
  return numeric.div(numeric.mul(distanceFromOrigin, clampedSize), maxSize);
};

export const numericRange = <N>(numeric: Numeric<N>): RangeFactory<N> => ({
  bounds: (size: Size, range: Range<N>): [N, N] => range.getSizedBounds(size),

  constant: (min: N, max: N): Range<N> => ({
    origin: min,
    getSizedBounds: () => [min, max],
  }),

  linear: (min: N, max: N): Range<N> => ({
    origin: min,
    getSizedBounds: (size) => {
      const minResized = clamp(numeric, min, max, scaleLinear(numeric, size, min, min));
      const maxResized = clamp(numeric, min, max, scaleLinear(numeric, size, min, max));
      return [minResized, maxResized];
    },
  }),
});

export const IntegerRange = numericRange(integerNumeric);

export namespace Range {
  export const bounds = IntegerRange.bounds;
  export const linear = IntegerRange.linear;
  export const constant = IntegerRange.constant;

  export const decimal = (): RangeFactory<number> => {
    throw new Error('Future API');
  };
}

export default Range;
