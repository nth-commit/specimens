import Sequence from './Sequence';

export type RoseTree<T> = [T, Sequence<RoseTree<T>>];

export namespace RoseTree {
  export const singleton = <T>(outcome: T): RoseTree<T> => [outcome, Sequence.empty()];

  export const outcome = <T>([outcome]: RoseTree<T>): T => outcome;

  export const map = <T, U>(f: (x: T) => U, [outcome, shrinks]: RoseTree<T>): RoseTree<U> => {
    return [f(outcome), shrinks.map((tree) => map(f, tree))];
  };

  export const filter = <T>(pred: (x: T) => boolean, [outcome, shrinks]: RoseTree<T>): Sequence<RoseTree<T>> => {
    const filteredShrinks = shrinks.bind((tree) => filter(pred, tree));
    return pred(outcome) ? Sequence.singleton([outcome, filteredShrinks]) : filteredShrinks;
  };

  export const expand = <T, U>(fs: Array<(x: T) => U>, tree: RoseTree<T>): Sequence<RoseTree<U>> => {
    return new Sequence(function* () {
      for (const f of fs) {
        yield map(f, tree);
      }
    });
  };
}

export default RoseTree;
