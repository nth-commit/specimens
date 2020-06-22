import Specimen, { Exhausted } from './Specimen';

export type ExhaustionStrategy = {
  recognize: (s: Specimen<unknown>) => void;
  isExhausted: () => boolean;
};

export namespace ExhaustionStrategy {
  export const apply = <T>(exhaustionStrategy: ExhaustionStrategy) =>
    function* (specimen: Specimen<T>) {
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
    let skipCount = 0;

    return {
      recognize: (s) => {
        if (Specimen.isSkipped(s)) {
          skipCount++;
        } else {
          skipCount = 0;
        }
      },
      isExhausted: () => skipCount >= maxNumberOfSkips,
    };
  };
}

export default ExhaustionStrategy;
