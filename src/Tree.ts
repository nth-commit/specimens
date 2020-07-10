import Sequence from './Sequence';

export type Tree<T> = [T, Sequence<Tree<T>>];

export namespace Tree {
  export const create = <T>(x: T, xs: Sequence<Tree<T>>): Tree<T> => [x, xs];

  export const singleton = <T>(outcome: T): Tree<T> => create(outcome, Sequence.empty());

  export const outcome = <T>([outcome]: Tree<T>): T => outcome;

  export const map = <T, U>([outcome, shrinks]: Tree<T>, f: (x: T) => U): Tree<U> => {
    return create(
      f(outcome),
      shrinks.map((tree) => map(tree, f)),
    );
  };

  export function filterShrinks<T, U extends T>(tree: Tree<T>, pred: (x: T) => x is U): Tree<U>;
  export function filterShrinks<T>(tree: Tree<T>, pred: (x: T) => boolean): Tree<T>;
  export function filterShrinks<T>([x, xs]: Tree<T>, pred: (x: T) => boolean): Tree<T> {
    return create(
      x,
      xs.filter(([x0]) => pred(x0)).map((tree) => filterShrinks(tree, pred)),
    );
  }

  export function filterForest<T, U extends T>(forest: Sequence<Tree<T>>, pred: (x: T) => x is U): Sequence<Tree<U>>;
  export function filterForest<T>(forest: Sequence<Tree<T>>, pred: (x: T) => boolean): Sequence<Tree<T>>;
  export function filterForest<T>(forest: Sequence<Tree<T>>, pred: (x: T) => boolean): Sequence<Tree<T>> {
    return forest
      .filter(([x]) => pred(x))
      .map<Tree<T>>(([x, xs]) => [x, filterForest(xs, pred)]);
  }

  export function unfold<Seed, Node>(f: (x: Seed) => Node, g: (x: Seed) => Sequence<Seed>, x: Seed): Tree<Node> {
    return create(f(x), unfoldForest(f, g, x));
  }

  export function unfoldForest<Seed, Node>(
    f: (x: Seed) => Node,
    g: (x: Seed) => Sequence<Seed>,
    x: Seed,
  ): Sequence<Tree<Node>> {
    return g(x).map((y) => unfold(f, g, y));
  }

  export function fold<Node, FoldedTree, FoldedForest>(
    [x, xs]: Tree<Node>,
    treeFolder: (x: Node, foldedForest: FoldedForest) => FoldedTree,
    forestFolder: (xs: Sequence<FoldedTree>) => FoldedForest,
  ): FoldedTree {
    return treeFolder(x, foldForest(xs, treeFolder, forestFolder));
  }

  export function foldForest<Node, FoldedTree, FoldedForest>(
    forest: Sequence<Tree<Node>>,
    treeFolder: (x: Node, foldedForest: FoldedForest) => FoldedTree,
    forestFolder: (xs: Sequence<FoldedTree>) => FoldedForest,
  ): FoldedForest {
    return forestFolder(forest.map((x) => fold(x, treeFolder, forestFolder)));
  }

  export const bind = <T, U>([x, xs]: Tree<T>, f: (x: T) => Tree<U>): Tree<U> => {
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

export default Tree;
