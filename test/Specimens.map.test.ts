import { Seed, IntegerRange, Specimens } from '../src';
import * as S from '../src/Specimens';
import { generate, generateOneTree, EvaluatedTree } from './Util';

describe('Specimens.map', () => {
  test.each`
    mapper                                  | specimens
    ${(x: number): number => x + 1}         | ${S.integer(IntegerRange.constant(0, 10))}
    ${(x: number): string => 'Hello, ' + x} | ${S.integer(IntegerRange.constant(0, 10))}
  `('It maps the outcome', ({ mapper, specimens }) => {
    const specimensMapped = specimens.map(mapper);

    const seed = Seed.spawn();
    const run = (specimens: Specimens<unknown>) => generate(specimens, seed, 10);

    expect(run(specimensMapped)).toEqual(run(specimens).map(mapper));
  });

  test('It maps the shrinks', () => {
    const seed: Seed = { split: () => [seed, seed], nextInt: () => 10 };
    const specimens = S.integer(IntegerRange.constant(0, 10)).map((x) => x + 1);

    const tree = generateOneTree(specimens, seed);

    expect(EvaluatedTree.shrinks(tree).map(EvaluatedTree.outcome)).toEqual([1, 6, 3, 2]);
  });
});
