import S, { SpecimensBuilder } from './Specimens';
import Specimen from './Specimen';
import { Random } from '../Random';
import Sequence from '../Sequence';
import Tree from '../Tree';
import Numeric, { integerNumeric } from '../Numeric';
import Shrink from '../Shrink';
import Range from '../Range';

const id = <T>(x: T): T => x;

export const create = <T>(r: Random<T>, shrinker: (x: T) => Sequence<T>): S<T> =>
  new SpecimensBuilder<T>(r.map((x) => Specimen.accepted(Tree.unfold(id, shrinker, x))));

export const rejected = <T>(): S<T> => new SpecimensBuilder(Random.constant(Specimen.rejected()));

export const constant = <T>(x: T): S<T> => create(Random.constant(x), Shrink.none());

export const infinite = <T>(x: T): S<T> => create(Random.infinite(x), Shrink.none());

export const integral = <N>(numeric: Numeric<N>, range: Range<N>): S<N> =>
  create(Random.integral(numeric, range), Shrink.towards(numeric, range.origin));

export const integer = (range: Range<number>): S<number> => integral(integerNumeric, range);

export const item = <T>(arr: Array<T>): S<T> => {
  if (arr.length === 0) {
    return rejected();
  }

  const range = Range.constant(0, arr.length - 1);
  return integer(range).map((ix) => arr[ix]);
};
