import * as S from '../src';
import { generateSpecimens, EvaluatedTree, TreeExtensions } from '../test/Util';

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

const s = S.scan([0, 0], ([, count]) =>
  count > 50
    ? S.rejected()
    : S.integer(S.Range.constant(0, 10))
        .noShrink()
        .map((x) => [x, x + count]),
);

const seed = S.Seed.spawn();

for (const x of s.generateTrees(seed, 30, 20)) {
  console.log(JSON.stringify(EvaluatedTree.simplify(TreeExtensions.evaluate(x)), null, 2));
}

console.log('Values!');

for (const x of S.integer(S.Range.constant(0, 10)).generate(seed, 30, 20)) {
  console.log(x);
}
