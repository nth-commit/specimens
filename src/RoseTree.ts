import Sequence from './Sequence';

export type RoseTree<T> = [T, Sequence<RoseTree<T>>];

export namespace RoseTree {
  export const create = <T>(x: T, xs: Sequence<RoseTree<T>>): RoseTree<T> => [x, xs];

  export const singleton = <T>(outcome: T): RoseTree<T> => create(outcome, Sequence.empty());

  export const outcome = <T>([outcome]: RoseTree<T>): T => outcome;

  export const map = <T, U>([outcome, shrinks]: RoseTree<T>, f: (x: T) => U): RoseTree<U> => {
    return create(
      f(outcome),
      shrinks.map((tree) => map(tree, f)),
    );
  };

  export function filterShrinks<T, U extends T>(tree: RoseTree<T>, pred: (x: T) => x is U): RoseTree<U>;
  export function filterShrinks<T>(tree: RoseTree<T>, pred: (x: T) => boolean): RoseTree<T>;
  export function filterShrinks<T>([x, xs]: RoseTree<T>, pred: (x: T) => boolean): RoseTree<T> {
    return create(
      x,
      xs.filter(([x0]) => pred(x0)).map((tree) => filterShrinks(tree, pred)),
    );
  }

  export function filterForest<T, U extends T>(
    forest: Sequence<RoseTree<T>>,
    pred: (x: T) => x is U,
  ): Sequence<RoseTree<U>>;
  export function filterForest<T>(forest: Sequence<RoseTree<T>>, pred: (x: T) => boolean): Sequence<RoseTree<T>>;
  export function filterForest<T>(forest: Sequence<RoseTree<T>>, pred: (x: T) => boolean): Sequence<RoseTree<T>> {
    return forest
      .filter(([x]) => pred(x))
      .map<RoseTree<T>>(([x, xs]) => [x, filterForest(xs, pred)]);
  }

  export function unfold<Seed, Node>(f: (x: Seed) => Node, g: (x: Seed) => Sequence<Seed>, x: Seed): RoseTree<Node> {
    return create(f(x), unfoldForest(f, g, x));
  }

  export function unfoldForest<Seed, Node>(
    f: (x: Seed) => Node,
    g: (x: Seed) => Sequence<Seed>,
    x: Seed,
  ): Sequence<RoseTree<Node>> {
    return g(x).map((y) => unfold(f, g, y));
  }

  export function fold<Node, FoldedNode, FoldedForest>(
    [x, xs]: RoseTree<Node>,
    f: (a: Node, x: FoldedForest) => FoldedNode,
    g: (xs: Sequence<FoldedNode>) => FoldedForest,
  ): FoldedNode {
    return f(x, foldForest(xs, f, g));
  }

  export function foldForest<Node, FoldedNode, FoldedForest>(
    forest: Sequence<RoseTree<Node>>,
    f: (a: Node, x: FoldedForest) => FoldedNode,
    g: (xs: Sequence<FoldedNode>) => FoldedForest,
  ): FoldedForest {
    return g(forest.map((x) => fold(x, f, g)));
  }

  export const bind = <T, U>([x, xs]: RoseTree<T>, f: (x: T) => RoseTree<U>): RoseTree<U> => {
    const [y, ys] = f(x);
    return create(
      y,
      Sequence.concat(
        ys,
        xs.map((t) => bind(t, f)),
      ),
    );
  };
}

export default RoseTree;
