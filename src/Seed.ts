import { mersenne, uniformIntDistribution, RandomGenerator } from 'pure-rand';

export type Seed = {
  nextInt(min: number, max: number): number;
  clone(): Seed;
  split(): [Seed, Seed];
};

export namespace Seed {
  const create = (r0: RandomGenerator): Seed => {
    let r = r0;

    let uniformInt = (min: number, max: number): number => {
      const [i, newRand] = uniformIntDistribution(min, max, r);
      r = newRand;
      return i;
    };

    return {
      nextInt: uniformInt,
      clone: () => create(r),
      split: () => {
        const [i, r2] = r.next();
        const [j] = r2.next();
        return [create(mersenne(i)), create(mersenne(j))];
      },
    };
  };

  export const spawn = (): Seed => create(mersenne(new Date().getTime()));
}

export default Seed;
