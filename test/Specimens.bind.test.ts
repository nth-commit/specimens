import { Specimens, IntegerRange, Seed, Exhausted, Random, Shrink, Specimen } from '../src';
import { sample, generateOneTree, EvaluatedTree, sampleOneTree, someSeedingIntegers, sampleSpecimens } from './Util';

namespace SeedMock {
  export const alwaysReturns = (nextInt: number): Seed => ({
    nextInt: () => nextInt,
    split: () => [alwaysReturns(nextInt), alwaysReturns(nextInt)],
  });
}

describe('Specimens.bind', () => {
  test('Exhausts if original specimen is exhausted', () => {
    const specimens = Specimens.rejected();
    const specimensK = specimens.bind(() => Specimens.constant(1));

    const result = sampleSpecimens(specimensK, 11);

    expect(result).toContainEqual(Exhausted);
  });

  test('Exhausts if k returns an exhausted specimen', () => {
    const specimens = Specimens.constant(1);
    const specimensK = specimens.bind(() => Specimens.rejected());

    const result = sampleSpecimens(specimensK, 11);

    expect(result).toContainEqual(Exhausted);
  });

  test('Returns if original specimen is infinite', () => {
    const specimens = Specimens.infinite(1);
    const specimensK = specimens.bind(() => Specimens.constant(2));

    sample(specimensK, 100);
  });

  test('Returns if k returns a infinite specimen', () => {
    const specimens = Specimens.constant(2);
    const specimensK = specimens.bind(() => Specimens.infinite(1));

    sample(specimensK, 100);
  });

  test('Binds a trivial specimens', () => {
    const k = (): Specimens<number> => Specimens.constant(2);
    const specimens = Specimens.constant(1);
    const specimens0 = specimens.bind(k);

    const result = sampleSpecimens(specimens0, 10);

    result.forEach((x) => expect(x).toEqual(Specimen.accepted(2)));
  });

  test('Binding to a constant preserves the structure of the shrinks', () => {
    const k = (): Specimens<number> => Specimens.constant(2);
    const specimens = Specimens.integer(IntegerRange.constant(0, 10));
    const specimens0 = specimens.bind(k);

    const seed = Seed.spawn();
    const unboundTree = generateOneTree(specimens, seed);
    const boundTree = generateOneTree(specimens0, seed);

    const getStructure = (tree: EvaluatedTree<unknown>): EvaluatedTree<string> => EvaluatedTree.map(tree, () => 'node');
    expect(getStructure(boundTree)).toEqual(getStructure(unboundTree));
  });
});
