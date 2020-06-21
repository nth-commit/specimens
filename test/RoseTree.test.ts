import { RoseTree, Sequence } from '../src';

type EvaluatedRoseTree<T> = T | [T, Array<EvaluatedRoseTree<T>>];

namespace RoseTreeExtensions {
  export const evaluate = <T>([outcome, shrinks]: RoseTree<T>): EvaluatedRoseTree<T> => {
    const evaluatedShrinks = shrinks.map(evaluate).toArray();

    if (evaluatedShrinks.length === 0) {
      return outcome;
    }

    return [outcome, evaluatedShrinks];
  };
}

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

describe('RoseTree.filter', () => {
  test('False predicate returns empty sequence', () => {
    const initialChildren = Sequence.from([1, 2, 3].map(RoseTree.singleton));
    const initial: RoseTree<number> = [1, initialChildren];

    const actual = RoseTree.filter(() => false, initial);
    const evaluated = actual.map(RoseTreeExtensions.evaluate).toArray();

    expect(evaluated).toEqual([]);
  });

  test('It can filter children', () => {
    const initialChildren = Sequence.from([2, 2, 2].map(RoseTree.singleton));
    const initial: RoseTree<number> = [1, initialChildren];

    const actual = RoseTree.filter((x) => x === 1, initial);
    const evaluated = actual.map(RoseTreeExtensions.evaluate).toArray();

    expect(evaluated).toEqual([1]);
  });

  test('If the root fails the predicate, its children become roots of new trees', () => {
    const initialChildren = Sequence.from([2, 2, 2].map(RoseTree.singleton));
    const initial: RoseTree<number> = [1, initialChildren];

    const actual = RoseTree.filter((x) => x === 2, initial);
    const evaluated = actual.map(RoseTreeExtensions.evaluate).toArray();

    expect(evaluated).toEqual([2, 2, 2]);
  });

  test('If a child fails the predicate, its children are allocated to the root', () => {
    const initialGrandchild = RoseTree.singleton(3);
    const initialChild: RoseTree<number> = [2, Sequence.from([initialGrandchild, initialGrandchild])];
    const initial: RoseTree<number> = [1, Sequence.singleton(initialChild)];

    const actual = RoseTree.filter((x) => x !== 2, initial);
    const evaluated = actual.map(RoseTreeExtensions.evaluate).toArray();

    expect(evaluated).toEqual([[1, [3, 3]]]);
  });
});

describe('RoseTree.expand', () => {
  test('If no mapper given, it collapses to the empty sequence', () => {
    const initialChildren = Sequence.from([1, 2, 3].map(RoseTree.singleton));
    const initial: RoseTree<number> = [1, initialChildren];

    const actual = RoseTree.expand([], initial);
    const evaluated = actual.map(RoseTreeExtensions.evaluate).toArray();

    expect(evaluated).toEqual([]);
  });

  test('If one identity mapper given, it returns a sequence of the initial tree', () => {
    const id = <T>(x: T): T => x;
    const initialChildren = Sequence.from([1, 2, 3].map(RoseTree.singleton));
    const initial: RoseTree<number> = [1, initialChildren];

    const actual = RoseTree.expand([id], initial);
    const evaluated = actual.map(RoseTreeExtensions.evaluate).toArray();

    const expected = RoseTreeExtensions.evaluate(initial);
    expect(evaluated).toEqual([expected]);
  });

  test('If two identity mappers given, it returns a sequence of the initial tree, repeated twice', () => {
    const id = <T>(x: T): T => x;
    const initialChildren = Sequence.from([1, 2, 3].map(RoseTree.singleton));
    const initial: RoseTree<number> = [1, initialChildren];

    const actual = RoseTree.expand([id, id], initial);
    const evaluated = actual.map(RoseTreeExtensions.evaluate).toArray();

    const expected = RoseTreeExtensions.evaluate(initial);
    expect(evaluated).toEqual([expected, expected]);
  });

  test('If one mapper given, it behaves like RoseTree.map', () => {
    const f = (x: number): number => x + 1;
    const initialChildren = Sequence.from([1, 2, 3].map(RoseTree.singleton));
    const initial: RoseTree<number> = [1, initialChildren];

    const actual = RoseTree.expand([f], initial);
    const evaluated = actual.map(RoseTreeExtensions.evaluate).toArray();

    const expected = RoseTreeExtensions.evaluate(RoseTree.map(f, initial));
    expect(evaluated).toEqual([expected]);
  });
});
