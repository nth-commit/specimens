import { IntegerRange, Seed } from '../src';
import { Specimens, Exhausted } from '../src';
import * as S from '../src/Specimens';
import { setDifference, EvaluatedTree, sampleSpecimens, sample, generateOneTree } from './Util';

describe('Specimens.filter', () => {
  test('It exhausts with an impossible predicate', () => {
    const specimens = S.integer(IntegerRange.constant(0, 10)).filter(() => false);

    const results = sampleSpecimens(specimens, 11);

    expect(results).toContainEqual(Exhausted);
  });

  test('Accepted specimens pass the predicate', () => {
    const predicate = (x: number): boolean => x % 2 === 0;
    const specimens = S.integer(IntegerRange.constant(0, 10)).filter(predicate);

    const results = sample(specimens, 100);

    results.forEach((x) => expect(predicate(x)).toStrictEqual(true));
  });

  test('Skipped specimens fail the predicate', () => {
    const predicate = (x: number): boolean => x % 2 === 0;
    const specimens = S.integer(IntegerRange.constant(0, 10));
    const filteredSpecimens = specimens.filter(predicate);

    const failingResults = setDifference(new Set(sample(specimens, 100)), new Set(sample(filteredSpecimens, 100)));

    failingResults.forEach((x) => expect(predicate(x)).toStrictEqual(false));
  });

  test('It filters the shrinks', () => {
    const seed: Seed = { split: () => [seed, seed], nextInt: () => 10 };
    const specimens = S.integer(IntegerRange.constant(0, 10)).filter((x) => x >= 5);

    const tree = generateOneTree(specimens, seed, 1);

    expect(EvaluatedTree.shrinks(tree).map(EvaluatedTree.outcome)).toEqual([5]);
  });
});
