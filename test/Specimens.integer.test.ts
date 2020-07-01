import { mean, sampleSkewness } from 'simple-statistics';
import { Seed, IntegerRange, Specimens, Exhausted, Specimen } from '../src';
import { DEFAULT_SIZE, sample, sampleSpecimens, generate, generateTrees, EvaluatedTree } from './Util';

describe('Specimens.integer', () => {
  const range = IntegerRange.constant(0, 10);

  test('All specimens are accepted', () => {
    const specimens = Specimens.integer(range);

    const results = sampleSpecimens(specimens, 100);

    expect(results).toHaveLength(100);
    results.forEach((x) => expect(x !== Exhausted && Specimen.isAccepted(x)).toEqual(true));
  });

  test('All specimens integers', () => {
    const specimens = Specimens.integer(range);

    const results = sample(specimens, 100);

    results.forEach((r) => expect(r).toStrictEqual(Math.round(r)));
  });

  test('All specimens are within the range', () => {
    const size = DEFAULT_SIZE;
    const specimens = Specimens.integer(range);

    const results = sample(specimens, 100, size);

    results.forEach((r) => {
      const [min, max] = IntegerRange.bounds(size, range);
      expect(r).toBeLessThanOrEqual(max);
      expect(r).toBeGreaterThanOrEqual(min);
    });
  });

  test('Specimens are evenly distributed', () => {
    const specimens = Specimens.integer(range);

    const results = sample(specimens, 10000);

    expect(mean(results)).toBeGreaterThan(4.9);
    expect(mean(results)).toBeLessThan(5.1);
    expect(Math.abs(sampleSkewness(results))).toBeLessThan(0.1);
  });

  test('Specimens are repeatable', () => {
    const seed = Seed.spawn();
    const specimens = Specimens.integer(range);

    const run = () => generate(specimens, seed, 100);

    expect(run()).toEqual(run());
  });

  test.each`
    givenInteger | evaluatedTree
    ${5}         | ${[5, [0, [2, [0, [1, [0]]]], [1, [0]]]]}
    ${12}        | ${[12, [0, [6, [0, [3, [0, [1, [0]]]], [1, [0]]]], [3, [0, [1, [0]]]], [1, [0]]]]}
  `('It shrinks towards the origin', ({ givenInteger, evaluatedTree }) => {
    const seed: Seed = { split: () => [seed, seed], nextInt: () => givenInteger };
    const specimen = Specimens.integer(IntegerRange.constant(0, givenInteger));

    const tree = EvaluatedTree.simplify(generateTrees(specimen, seed, 1)[0]);

    expect(tree).toEqual(evaluatedTree);
  });
});
