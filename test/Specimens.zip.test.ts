import { IntegerRange, Seed, Specimens, Exhausted, Shrink, Integer, Random } from '../src';
import { sampleSpecimens, generateTrees, SeedMock, generateOneTree } from './Util';
import { EvaluatedTree } from './Util';

const controlledInteger = (x: number): Specimens<number> =>
  Specimens.create(Random.constant(x), Shrink.towards(Integer, 0));

const controlledIntegerSequence = (xs: number[]): Specimens<number> =>
  Specimens.create(Random.sequence(xs), Shrink.towards(Integer, 0));

describe('Specimens.zip', () => {
  test('Zip (0, 0)', () => {
    const l = controlledInteger(0);
    const r = controlledInteger(0);
    const z = Specimens.zip(l, r);

    const results = EvaluatedTree.simplify(generateOneTree(z, Seed.spawn(), 0));

    expect(results).toEqual([0, 0]);
  });

  test('Zip (1, 0)', () => {
    const l = controlledInteger(1);
    const r = controlledInteger(0);
    const z = Specimens.zip(l, r);

    const results = EvaluatedTree.simplify(generateOneTree(z, Seed.spawn(), 0));

    expect(results).toEqual([[1, 0], [[0, 0]]]);
  });

  test('Zip (0, 1)', () => {
    const l = controlledInteger(0);
    const r = controlledInteger(1);
    const z = Specimens.zip(l, r);

    const results = EvaluatedTree.simplify(generateOneTree(z, Seed.spawn(), 0));

    expect(results).toEqual([[0, 1], [[0, 0]]]);
  });

  test('Zip (1, 1)', () => {
    const l = controlledInteger(1);
    const r = controlledInteger(1);
    const z = Specimens.zip(l, r);

    const results = EvaluatedTree.simplify(generateOneTree(z, Seed.spawn(), 0));

    expect(results).toEqual([
      [1, 1],
      [
        [1, 0],
        [[0, 1], [[0, 0]]],
      ],
    ]);
  });

  test('Zip (2, 2)', () => {
    const l = controlledInteger(2);
    const r = controlledInteger(2);
    const z = Specimens.zip(l, r);

    const results = EvaluatedTree.simplify(generateOneTree(z, Seed.spawn(), 0));

    expect(results).toEqual([
      [2, 2],
      [
        [2, 0],
        [[2, 1], [[2, 0]]],
        [
          [0, 2],
          [
            [0, 0],
            [[0, 1], [[0, 0]]],
          ],
        ],
        [
          [1, 2],
          [
            [1, 0],
            [[1, 1], [[1, 0]]],
            [
              [0, 2],
              [
                [0, 0],
                [[0, 1], [[0, 0]]],
              ],
            ],
          ],
        ],
      ],
    ]);
  });

  test('Zip (4, 0)', () => {
    const l = controlledInteger(4);
    const r = controlledInteger(0);
    const z = Specimens.zip(l, r);

    const results = EvaluatedTree.simplify(generateOneTree(z, Seed.spawn(), 0));

    expect(results).toEqual([
      [4, 0],
      [
        [0, 0],
        [
          [2, 0],
          [
            [0, 0],
            [[1, 0], [[0, 0]]],
          ],
        ],
        [[1, 0], [[0, 0]]],
      ],
    ]);
  });

  test('Zip (0, 4)', () => {
    const l = controlledInteger(0);
    const r = controlledInteger(4);
    const z = Specimens.zip(l, r);

    const results = EvaluatedTree.simplify(generateOneTree(z, Seed.spawn(), 0));

    expect(results).toEqual([
      [0, 4],
      [
        [0, 0],
        [
          [0, 2],
          [
            [0, 0],
            [[0, 1], [[0, 0]]],
          ],
        ],
        [[0, 1], [[0, 0]]],
      ],
    ]);
  });

  test('Zip (0, [0, 1])', () => {
    const l = controlledInteger(0);
    const r = controlledIntegerSequence([0, 1]);
    const z = Specimens.zip(l, r);

    const results = generateTrees(z, Seed.spawn(), 2, 0).map(EvaluatedTree.simplify);

    expect(results[0]).toEqual([0, 0]);
    expect(results[1]).toEqual([[0, 1], [[0, 0]]]);
  });

  test('Zip ([1, 0], 0)', () => {
    const l = Specimens.create(Random.sequence([1, 0]), Shrink.towards(Integer, 0));
    const r = controlledInteger(0);
    const z = Specimens.zip(l, r);

    const results = generateTrees(z, Seed.spawn(), 2, 0).map(EvaluatedTree.simplify);

    expect(results[0]).toEqual([[1, 0], [[0, 0]]]);
    expect(results[1]).toEqual([0, 0]);
  });

  test('Zip ([0, 1], [0, 1])', () => {
    const a = controlledIntegerSequence([0, 1]);
    const b = controlledIntegerSequence([0, 1]);
    const z = Specimens.zip(a, b);

    const results = generateTrees(z, Seed.spawn(), 4, 0).map(EvaluatedTree.simplify);

    expect(results[0]).toEqual([0, 0]);
    expect(results[1]).toEqual([[0, 1], [[0, 0]]]);
    expect(results[2]).toEqual([
      [1, 0],
      [
        [0, 0],
        [[0, 1], [[0, 0]]],
      ],
    ]);
    expect(results[3]).toEqual([
      [1, 1],
      [
        [1, 0],
        [0, 0],
        [[0, 1], [[0, 0]]],
      ],
    ]);
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

  test('Given an infinite left component, it returns', () => {
    const specimens = Specimens.zip(Specimens.infinite(0), Specimens.constant(0));

    sampleSpecimens(specimens, 100);
  });

  test('Given an infinite right component, it returns', () => {
    const specimens = Specimens.zip(Specimens.constant(0), Specimens.infinite(0));

    sampleSpecimens(specimens, 100);
  });
});
