import { RoseTree, Sequence } from '../src';
import { RoseTreeExtensions } from './Util';

describe('RoseTreeExtensions.evaluate', () => {
  test('It can evaluate a tree', () => {
    const initial: RoseTree<number> = [1, Sequence.from([1, 2, 3].map(RoseTree.singleton))];

    const actual = RoseTreeExtensions.evaluate(initial);

    expect(actual).toEqual([1, [1, 2, 3]]);
  });

  test('If there are no children, it can reduce the tree', () => {
    const initial: RoseTree<number> = [1, Sequence.empty()];

    const actual = RoseTreeExtensions.evaluate(initial);

    expect(actual).toEqual(1);
  });
});

test('RoseTree.map', () => {
  const initial: RoseTree<number> = [1, Sequence.from([1, 2, 3].map(RoseTree.singleton))];

  const actual = RoseTreeExtensions.evaluate(RoseTree.map((x) => x + 1, initial));

  expect(actual).toEqual([2, [2, 3, 4]]);
});
