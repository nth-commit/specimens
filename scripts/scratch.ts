import { IntegerRange, Seed, Shrink, Integer, Sequence, Specimens } from '../src';
import { generateSpecimens } from '../test/Util';

const loggingSeedDecorator = (seed: Seed, idPath: Array<'L' | 'R'> = []): Seed => {
  const id = idPath.join(':');

  const log = (msg: string) => {
    console.log(`Seed[${id}] - ${msg}`);
  };

  return {
    _id: id,
    nextInt: (min, max) => {
      const x = seed.nextInt(min, max);
      log(`nextInt(${min}, ${max}) => ${x}`);
      return x;
    },
    split: () => {
      log('split()');
      return seed.split().map((s, i) => loggingSeedDecorator(s, [...idPath, i === 0 ? 'L' : 'R'])) as [Seed, Seed];
    },
  } as Seed;
};

const predicateA = (x: number): boolean => x % 2 === 0;
const predicateB = (x: number): boolean => x % 3 === 0;
const specimens = Specimens.integer(IntegerRange.constant(1, 6));

const seed = loggingSeedDecorator(Seed.create(3));
// const test = generateSpecimens(specimens, seed, 10);
// console.log(test);

// const test2 = generateSpecimens(specimens.filter(predicateA).filter(predicateB), seed, 10);
// console.log(test2);

const test3 = generateSpecimens(specimens.filter(predicateB).filter(predicateA), seed, 6);
console.log(test3);
