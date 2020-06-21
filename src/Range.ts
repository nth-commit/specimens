import Numeric, { Integer } from './Numeric';

export type Size = number;

export type Range<T> = { origin: T; getSizedBounds: (size: Size) => [T, T] };

export const numericRange = <N>(numeric: Numeric<N>) => {
  const clamp = (x: N, y: N, n: N): N =>
    x > y ? numeric.min(x, numeric.max(y, n)) : numeric.min(y, numeric.max(x, n));

  const scaleLinear = (size: Size, origin: N, n: N): N => {
    const maxSize = numeric.parse(99);
    const currentSize = numeric.parse(size);
    const clampedSize = clamp(numeric.ZERO, maxSize, currentSize);
    const distanceFromOrigin = numeric.sub(n, origin);
    return numeric.div(numeric.mul(distanceFromOrigin, clampedSize), maxSize);
  };

  const bounds = (size: Size, range: Range<number>): [number, number] => range.getSizedBounds(size);

  const constant = (min: N, max: N): Range<N> => ({
    origin: min,
    getSizedBounds: () => [min, max],
  });

  const linear = (min: N, max: N): Range<N> => ({
    origin: min,
    getSizedBounds: (size) => {
      const minResized = clamp(min, max, scaleLinear(size, min, min));
      const maxResized = clamp(min, max, scaleLinear(size, min, max));
      return [minResized, maxResized];
    },
  });

  return {
    bounds,
    constant,
    linear,
  };
};

export const IntegerRange = numericRange(Integer);

export default Range;
