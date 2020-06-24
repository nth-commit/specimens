import { mersenne, uniformIntDistribution, RandomGenerator } from 'pure-rand';

export type Seed = {
  nextInt(min: number, max: number): number;
  clone(): Seed;
  split(): [Seed, Seed];
};

export namespace Seed {
  const makeSeed = (r0: RandomGenerator): Seed => {
    let r = r0;

    let uniformInt = (min: number, max: number): number => {
      const [i, newRand] = uniformIntDistribution(min, max, r);
      r = newRand;
      return i;
    };

    return {
      nextInt: uniformInt,
      clone: () => makeSeed(r),
      split: () => {
        const [i, r2] = r.next();
        const [j] = r2.next();
        return [makeSeed(mersenne(i)), makeSeed(mersenne(j))];
      },
    };
  };

  export const create = (seed: number): Seed => makeSeed(mersenne(seed));

  export const spawn = (): Seed => create(new Date().getTime());
}

export default Seed;
