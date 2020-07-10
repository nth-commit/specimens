import { Specimen } from './Specimen';
import { Tree } from './Tree';

export const Exhausted = Symbol('Exhausted');

export type ExhaustionStrategy = {
  recognize: <T>(s: Specimen<Tree<T>>) => void;
  isExhausted: () => boolean;
};

export namespace ExhaustionStrategy {
  export const apply = <T>(exhaustionStrategy: ExhaustionStrategy) =>
    function* (specimen: Specimen<Tree<T>>): Generator<Specimen<Tree<T>> | typeof Exhausted> {
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
      recognize: (x) => {
        if (Specimen.isRejected(x)) {
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
