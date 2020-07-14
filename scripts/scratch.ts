import * as S from '../src';
import { generateSpecimens, EvaluatedTree, TreeExtensions } from '../test/Util';
import { reducerSpecimens } from './todoListReducer';
import { Seed } from '../src';

const loggingSeedDecorator = (seed: S.Seed, idPath: Array<'L' | 'R'> = []): S.Seed => {
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
      return seed.split().map((s, i) => loggingSeedDecorator(s, [...idPath, i === 0 ? 'L' : 'R'])) as [S.Seed, S.Seed];
    },
  } as S.Seed;
};

// const seed = loggingSeedDecorator(Seed.create(3));

// for (const x of reducerSpecimens.generate(Seed.spawn(), 50, 10)) {
//   console.log(JSON.stringify(x, null, 2));
// }

const specimens = S.integer(S.Range.constant(0, 10));
S.printStatistics(specimens, (s) => s.toString(), { sampleSize: 1000000 });
