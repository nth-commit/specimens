import Sequence from './Sequence';

export type RoseTree<T> = [T, Sequence<RoseTree<T>>];

export namespace RoseTree {
  export const singleton = <T>(outcome: T): RoseTree<T> => [outcome, Sequence.empty()];

  export const outcome = <T>([outcome]: RoseTree<T>): T => outcome;

  export const map = <T, U>(f: (x: T) => U, [outcome, shrinks]: RoseTree<T>): RoseTree<U> => {
    return [f(outcome), shrinks.map((tree) => map(f, tree))];
  };

  export const filterShrinks = <T>(pred: (x: T) => boolean, [x, xs]: RoseTree<T>): RoseTree<T> => {
    return [x, xs.filter(([x0]) => pred(x0)).map((tree) => filterShrinks(pred, tree))];
  };

  export const unfold = (() => {
    function unfold<T, U>(fNode: (x: T) => U, fChildren: (x: T) => Sequence<T>, x: T): RoseTree<U> {
      return [fNode(x), unfoldForest(fNode, fChildren, x)];
    }

    function unfoldForest<T, U>(fNode: (x: T) => U, fChildren: (x: T) => Sequence<T>, x: T): Sequence<RoseTree<U>> {
      return fChildren(x).map((y) => unfold(fNode, fChildren, y));
    }

    return unfold;
  })();

  export const bind = <T, U>(f: (x: T) => RoseTree<U>, [x, xs]: RoseTree<T>): RoseTree<U> => {
    const [y, ys] = f(x);
    return [
      y,
      Sequence.concat(
        ys,
        xs.map((t) => bind(f, t)),
      ),
    ];
  };
}

export default RoseTree;
