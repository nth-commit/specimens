import { Specimens, IntegerRange, Specimen, Seed } from '../src';

const makeLoggingSeedDecorator = () => {
  let idCount = 0;

  const loggingSeedDecorator = (seed: Seed, parentIds: number[] = []): Seed => {
    const id = idCount++;

    const idPath = [...parentIds, id];

    const log = (msg: string) => {
      console.log(`Seed[${idPath.join(':')}] - ${msg}`);
    };

    log(`INIT`);

    return {
      nextInt: (min, max) => {
        const x = seed.nextInt(min, max);
        log(`nextInt(${min}, ${max}) => ${x}`);
        return x;
      },
      split: () => {
        console.log(`split()`);
        return seed.split().map((s) => loggingSeedDecorator(s, [...parentIds, id])) as [Seed, Seed];
      },
    };
  };

  const loggingSeedDecorator2 = (seed: Seed, idPath: Array<'L' | 'R'> = []): Seed => {
    const log = (msg: string) => {
      console.log(`Seed[${idPath.join(':')}] - ${msg}`);
    };

    return {
      nextInt: (min, max) => {
        const x = seed.nextInt(min, max);
        log(`nextInt(${min}, ${max}) => ${x}`);
        return x;
      },
      split: () => {
        log('split()');
        return seed.split().map((s, i) => loggingSeedDecorator2(s, [...idPath, i === 0 ? 'L' : 'R'])) as [Seed, Seed];
      },
    };
  };

  return loggingSeedDecorator2;
};

const seed = makeLoggingSeedDecorator()(Seed.create(0));

const specimens2 = Specimens.integer(IntegerRange.constant(0, 10))
  .filter((x) => x > 10)
  .run(seed, 50, 10);

for (const s of specimens2) {
  console.log(s);
}
