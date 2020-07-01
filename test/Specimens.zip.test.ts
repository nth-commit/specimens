import { IntegerRange, Seed, Specimens, Exhausted } from '../src';
import { sampleSpecimens, generateTrees } from './Util';
import { EvaluatedTree } from './Util';

describe('Specimens.zip', () => {
  test('It has equivalency with its left component', () => {
    const specimensLeft = Specimens.integer(IntegerRange.constant(1, 10));
    const specimensZipped = Specimens.zip(specimensLeft, Specimens.constant(0));

    const seed = Seed.create(0);
    const zippedResults = generateTrees(specimensZipped, seed, 10);
    const leftResults = generateTrees(specimensLeft, seed, 10);

    const leftResultsOfZip = zippedResults.map((tree) => EvaluatedTree.map(tree, ([left]) => left));
    expect(leftResultsOfZip).toEqual(leftResults);
  });

  test.skip('It has equivalency with its right component', () => {
    const specimensRight = Specimens.integer(IntegerRange.constant(1, 10));
    const specimensZipped = Specimens.zip(Specimens.constant(0), specimensRight);

    const seed = Seed.create(0);
    const zippedResults = generateTrees(specimensZipped, seed, 2);
    const rightResults = generateTrees(specimensRight, seed, 2);

    const rightResultsOfZip = zippedResults.map((tree) => EvaluatedTree.map(tree, ([, right]) => right));
    expect(rightResultsOfZip).toEqual(rightResults);
  });

  test('Given a rejected left component, it exhausts', () => {
    const specimens = Specimens.zip(Specimens.rejected(), Specimens.constant(0));

    const results = sampleSpecimens(specimens, 100);

    expect(results).toContainEqual(Exhausted);
  });

  test('Given a rejected right component, it exhausts', () => {
    const specimens = Specimens.zip(Specimens.constant(0), Specimens.rejected());

    const results = sampleSpecimens(specimens, 100);

    expect(results).toContainEqual(Exhausted);
  });
});
