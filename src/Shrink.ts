import Sequence from './Sequence';
import Numeric from './Numeric';

export type Shrinker<T> = (x: T) => Sequence<T>;

export namespace Shrink {
  const takeHalves = <N>(numeric: Numeric<N>, from: N): Sequence<N> =>
    Sequence.unfold((previous) => {
      if (numeric.eq(previous, numeric.ZERO)) {
        return undefined;
      }

      const two = numeric.add(numeric.ONE, numeric.ONE);
      const next = numeric.div(previous, two);
      if (numeric.eq(previous, next)) {
        return undefined;
      }

      return next;
    }, from).skip(1);

  /**
   * Takes gradually smaller decrements towards the destination.
   * @param destination The eventual target to shrink to.
   * @param n The number to shrink.
   */
  export const towards = <N>(numeric: Numeric<N>, destination: N): Shrinker<N> => (x) => {
    if (numeric.eq(destination, x)) {
      return Sequence.empty();
    }

    const differenceFromDestination = numeric.sub(x, destination);
    const halves = takeHalves(numeric, differenceFromDestination).map((h) => numeric.add(h, destination));
    return Sequence.concat(Sequence.singleton(destination), halves);
  };
}

export default Shrink;
