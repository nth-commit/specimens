import { Specimen } from './Specimen';
import { RoseTree as Tree } from './RoseTree';
import { SpecimenTree } from './SpecimenTree';

export const Exhausted = Symbol('Exhausted');

export type ExhaustionStrategy = {
  recognize: <T>(s: SpecimenTree<T>) => void;
  isExhausted: () => boolean;
};

export namespace ExhaustionStrategy {
  export const apply = <T>(exhaustionStrategy: ExhaustionStrategy) =>
    function* (specimen: SpecimenTree<T>): Generator<SpecimenTree<T> | typeof Exhausted> {
      if (exhaustionStrategy.isExhausted()) {
        throw 'Error: Attempted to take from exhausted specimens';
      }

      yield specimen;

      exhaustionStrategy.recognize(specimen);
      if (exhaustionStrategy.isExhausted()) {
        yield Exhausted;
      }
    };

  export const followingConsecutiveSkips = (maxNumberOfSkips: number): ExhaustionStrategy => {
    let rejectionCount = 0;
    return {
      recognize: (t) => {
        if (SpecimenTree.isRejected(t)) {
          rejectionCount++;
        } else {
          rejectionCount = 0;
        }
      },
      isExhausted: () => rejectionCount >= maxNumberOfSkips,
    };
  };
}

export default ExhaustionStrategy;
