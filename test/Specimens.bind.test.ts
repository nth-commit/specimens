import * as S from '../src/Specimens';
import { IntegerRange, Seed, Exhausted, Specimen } from '../src';
import { sample, generateOneTree, EvaluatedTree, sampleSpecimens, SeedMock } from './Util';

describe('Specimens.bind', () => {
  test('Exhausts if original specimen is exhausted', () => {
    const specimens = S.rejected();
    const specimensK = specimens.bind(() => S.constant(1));

    const result = sampleSpecimens(specimensK, 11);

    expect(result).toContainEqual(Exhausted);
  });

  test('Exhausts if k returns an exhausted specimen', () => {
    const specimens = S.constant(1);
    const specimensK = specimens.bind(() => S.rejected());

    const result = sampleSpecimens(specimensK, 11);

    expect(result).toContainEqual(Exhausted);
  });

  test('Returns if original specimen is infinite', () => {
    const specimens = S.infinite(1);
    const specimensK = specimens.bind(() => S.constant(2));

    sample(specimensK, 100);
  });

  test('Returns if k returns a infinite specimen', () => {
    const specimens = S.constant(2);
    const specimensK = specimens.bind(() => S.infinite(1));

    sample(specimensK, 100);
  });

  test('Binds a trivial specimens', () => {
    const k = (): S.Specimens<number> => S.constant(2);
    const specimens = S.constant(1);
    const specimens0 = specimens.bind(k);

    const result = sampleSpecimens(specimens0, 10);

    result.forEach((x) => expect(x).toEqual(Specimen.accepted(2)));
  });

  test('Binding to a constant preserves the structure of the shrinks', () => {
    const k = (): S.Specimens<number> => S.constant(2);
    const specimens = S.integer(IntegerRange.constant(0, 10));
    const specimens0 = specimens.bind(k);

    // const seed = Seed.spawn();
    const seed = SeedMock.constant(6);
    const unboundTree = generateOneTree(specimens, seed);
    const boundTree = generateOneTree(specimens0, seed);

    const getStructure = (tree: EvaluatedTree<unknown>): EvaluatedTree<string> => EvaluatedTree.map(tree, () => 'node');
    expect(getStructure(boundTree)).toEqual(getStructure(unboundTree));
  });
});
