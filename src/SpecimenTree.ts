import { Specimen } from './Specimen';
import { RoseTree as Tree } from './RoseTree';
import Sequence from './Sequence';

export type SpecimenTree<T> = Tree<Specimen<T>>;

export namespace SpecimenTree {
  export const accepted = <T>(x: T): SpecimenTree<T> => Tree.singleton(Specimen.accepted(x));
  export const rejected = <T>(): SpecimenTree<T> => Tree.singleton(Specimen.rejected());

  export const isAccepted = <T>(t: SpecimenTree<T>): boolean => Specimen.isAccepted(Tree.outcome(t));
  export const isRejected = <T>(t: SpecimenTree<T>): boolean => Specimen.isRejected(Tree.outcome(t));

  export const map = <T, U>(t: SpecimenTree<T>, f: (x: T) => U): SpecimenTree<U> =>
    Tree.map(t, (s) => Specimen.map(s, f));

  export const bind = <T, U>(specimenTree: SpecimenTree<T>, f: (x: T) => SpecimenTree<U>): SpecimenTree<U> => {
    return Tree.bind(specimenTree, (specimen) => {
      const specimenOfSpecimenTree = Specimen.map(specimen, f);
      if (Specimen.isRejected(specimenOfSpecimenTree)) {
        return rejected();
      }
      return specimenOfSpecimenTree.value;
    });
  };

  export const bindSpecimen = <T, U>(t: SpecimenTree<T>, k: (x: T) => Specimen<U>): SpecimenTree<U> =>
    Tree.map(t, (s) => Specimen.bind(s, k));

  export const unfold = <Seed, T>(
    f: (x: Seed) => Specimen<T>,
    g: (x: Seed) => Sequence<Seed>,
    x: Seed,
  ): SpecimenTree<T> => Tree.unfold<Seed, Specimen<T>>(f, g, x);

  export const fold = <T, TResult, TIntermediateResult>(
    specimenTree: SpecimenTree<T>,
    f: (a: Specimen<T>, x: TIntermediateResult) => TResult,
    g: (xs: Sequence<TResult>) => TIntermediateResult,
  ): TResult => {
    return Tree.fold(specimenTree, f, g);
  };

  const pickAcceptedForest = <T>(specimenForest: Sequence<SpecimenTree<T>>): Sequence<Tree<T>> =>
    Tree.filterForest(specimenForest, Specimen.isAccepted).map((t) => Tree.map(t, (s) => s.value));

  export const toMaybeTree = <T>([specimenOutcome, specimenShrinks]: SpecimenTree<T>): Tree<T> | undefined =>
    Specimen.unwrap(
      specimenOutcome,
      (value) => Tree.create<T>(value, pickAcceptedForest(specimenShrinks)),
      () => undefined,
    );

  export const specimenOutcome = <T>([specimenOutcome]: SpecimenTree<T>): Specimen<T> => specimenOutcome;
}
