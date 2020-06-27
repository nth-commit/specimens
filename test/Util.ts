import { RoseTree } from '../src';

export type EvaluatedRoseTree<T> = T | [T, Array<EvaluatedRoseTree<T>>];

export namespace RoseTreeExtensions {
  export const evaluate = <T>([outcome, shrinks]: RoseTree<T>): EvaluatedRoseTree<T> => {
    const evaluatedShrinks = shrinks.map(evaluate).toArray();

    if (evaluatedShrinks.length === 0) {
      return outcome;
    }

    return [outcome, evaluatedShrinks];
  };

  export const directShrinks = <T>([, shrinks]: RoseTree<T>): T[] => Array.from(shrinks.map(RoseTree.outcome));
}
