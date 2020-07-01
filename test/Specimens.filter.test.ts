import { IntegerRange, Seed } from '../src';
import { Specimens, Exhausted } from '../src';
import { setDifference, EvaluatedTree, sampleSpecimens, sample, generateOneTree, generateSpecimens } from './Util';

const someSeedingIntegers = (): number[] => [...Array(10).keys()];

describe('Specimens.filter', () => {
  test('It exhausts with an impossible predicate', () => {
    const specimens = Specimens.integer(IntegerRange.constant(0, 10)).filter(() => false);

    const results = sampleSpecimens(specimens, 11);

    expect(results).toContainEqual(Exhausted);
  });

  test('Accepted specimens pass the predicate', () => {
    const predicate = (x: number): boolean => x % 2 === 0;
    const specimens = Specimens.integer(IntegerRange.constant(0, 10)).filter(predicate);

    const results = sample(specimens, 100);

    results.forEach((x) => expect(predicate(x)).toStrictEqual(true));
  });

  test('Skipped specimens fail the predicate', () => {
    const predicate = (x: number): boolean => x % 2 === 0;
    const specimens = Specimens.integer(IntegerRange.constant(0, 10));
    const filteredSpecimens = specimens.filter(predicate);

    const failingResults = setDifference(new Set(sample(specimens, 100)), new Set(sample(filteredSpecimens, 100)));

    failingResults.forEach((x) => expect(predicate(x)).toStrictEqual(false));
  });

  test('It filters the shrinks', () => {
    const seed: Seed = { split: () => [seed, seed], nextInt: () => 10 };
    const specimens = Specimens.integer(IntegerRange.constant(0, 10)).filter((x) => x >= 5);

    const tree = generateOneTree(specimens, seed, 1);

    expect(EvaluatedTree.shrinks(tree).map(EvaluatedTree.outcome)).toEqual([5]);
  });

  test.each(someSeedingIntegers())('It is distributable', (seeder) => {
    const predicateA = (x: number): boolean => x % 2 === 0;
    const predicateB = (x: number): boolean => x % 3 === 0;
    const specimens = Specimens.integer(IntegerRange.constant(1, 6));

    const seed = Seed.create(seeder);
    const run = (specimens: Specimens<number>) => generateSpecimens(specimens, seed, 100);

    expect(run(specimens.filter(predicateA).filter(predicateB))).toEqual(
      run(specimens.filter((x) => predicateA(x) && predicateB(x))),
    );
  });

  test.each(someSeedingIntegers())('It is commutative', (seeder) => {
    const predicateA = (x: number): boolean => x % 2 === 0;
    const predicateB = (x: number): boolean => x % 3 === 0;
    const specimens = Specimens.integer(IntegerRange.constant(1, 6));

    const seed = Seed.create(seeder);
    const run = (specimens: Specimens<number>) => generateSpecimens(specimens, seed, 100);

    expect(run(specimens.filter(predicateA).filter(predicateB))).toEqual(
      run(specimens.filter(predicateB).filter(predicateA)),
    );
  });
});
