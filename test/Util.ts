import { Seed, Specimens, RoseTree as Tree, MaybeExhaustedSpecimen } from '../src';

export type EvaluatedTree<T> = [T, Array<EvaluatedTree<T>>];

export type SimpleEvaluatedTree<T> = T | [T, Array<SimpleEvaluatedTree<T>>];

export namespace EvaluatedTree {
  export const create = <T>(outcome: T, shrinks: Array<EvaluatedTree<T>>): EvaluatedTree<T> => {
    return [outcome, shrinks];
  };

  export const outcome = <T>(tree: EvaluatedTree<T>): T => {
    if (Array.isArray(tree)) {
      return tree[0];
    }
    return tree;
  };

  export const shrinks = <T>(tree: EvaluatedTree<T>): Array<EvaluatedTree<T>> => {
    if (Array.isArray(tree)) {
      const shrinks = tree[1];
      return Array.isArray(shrinks) ? shrinks : [shrinks];
    }
    return [];
  };

  export const map = <T, U>(tree: EvaluatedTree<T>, f: (x: T) => U): EvaluatedTree<U> => {
    const x = f(outcome(tree));
    const xs = shrinks(tree).map((t) => map(t, f));
    return create(x, xs);
  };

  export const simplify = <T>([x, xs]: EvaluatedTree<T>): SimpleEvaluatedTree<T> => {
    if (xs.length === 0) {
      return x;
    }
    return [x, xs.map(simplify)];
  };
}

export namespace RoseTreeExtensions {
  export const evaluate = <T>([outcome, shrinks]: Tree<T>): EvaluatedTree<T> => {
    const evaluatedShrinks = shrinks.map(evaluate).toArray();
    return [outcome, evaluatedShrinks];
  };
}

export const setDifference = <T>(a: Set<T>, b: Set<T>): Set<T> => {
  return new Set([...a].filter((x) => !b.has(x)));
};

export const DEFAULT_SIZE = 50;

export const sample = <T>(specimens: Specimens<T>, count: number, size: number = DEFAULT_SIZE): T[] =>
  Array.from(specimens.sample(size, count));

export const sampleSpecimens = <T>(
  specimens: Specimens<T>,
  count: number,
  size: number = DEFAULT_SIZE,
): Array<MaybeExhaustedSpecimen<T>> => Array.from(specimens.sampleSpecimens(size, count));

export const sampleTrees = <T>(
  specimens: Specimens<T>,
  count: number,
  size: number = DEFAULT_SIZE,
): Array<EvaluatedTree<T>> => Array.from(specimens.sampleTrees(size, count).map(RoseTreeExtensions.evaluate));

export const sampleOneTree = <T>(specimens: Specimens<T>, size: number = DEFAULT_SIZE): EvaluatedTree<T> =>
  sampleTrees(specimens, 1, size)[0];

export const generate = <T>(specimens: Specimens<T>, seed: Seed, count: number, size: number = DEFAULT_SIZE): T[] =>
  Array.from(specimens.generate(seed, size, count));

export const generateOne = <T>(specimens: Specimens<T>, seed: Seed, size: number = DEFAULT_SIZE): T =>
  generate(specimens, seed, 1, size)[0];

export const generateSpecimens = <T>(
  specimens: Specimens<T>,
  seed: Seed,
  count: number,
  size: number = DEFAULT_SIZE,
): Array<MaybeExhaustedSpecimen<T>> => Array.from(specimens.generateSpecimens(seed, size, count));

export const generateTrees = <T>(
  specimens: Specimens<T>,
  seed: Seed,
  count: number,
  size: number = DEFAULT_SIZE,
): Array<EvaluatedTree<T>> => Array.from(specimens.generateTrees(seed, size, count).map(RoseTreeExtensions.evaluate));

export const generateOneTree = <T>(
  specimens: Specimens<T>,
  seed: Seed,
  size: number = DEFAULT_SIZE,
): EvaluatedTree<T> => generateTrees(specimens, seed, 1, size)[0];

export const someSeedingIntegers = (): number[] => [...Array(10).keys()];
