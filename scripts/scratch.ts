import { Specimens, IntegerRange, Specimen, Seed, Shrink, Integer, Sequence, SpecimensBuilder } from '../src';

const repeat = <T>(s: SpecimensBuilder<T>, times: number): SpecimensBuilder<T> =>
  s.bind((x) =>
    Specimens.createUnshrinkable((seed) =>
      Sequence.infinite()
        .map(() => [seed, x] as [Seed, T])
        .take(times),
    ),
  );

const specimensLeft = repeat(Specimens.integer(IntegerRange.constant(0, 10)), 2);

const specimensRight = Specimens.integer(IntegerRange.constant(0, 10));

const specimens = Specimens.zip(specimensLeft, specimensRight);

const seed = Seed.spawn();

for (const x of specimensRight.generate(seed, 50, 10)) {
  console.log(x);
}

for (const x of specimens.generate(seed, 50, 10)) {
  console.log(x);
}

// const loggingSeedDecorator = (seed: Seed, idPath: Array<'L' | 'R'> = []): Seed => {
//   const log = (msg: string) => {
//     console.log(`Seed[${idPath.join(':')}] - ${msg}`);
//   };

//   return {
//     nextInt: (min, max) => {
//       const x = seed.nextInt(min, max);
//       log(`nextInt(${min}, ${max}) => ${x}`);
//       return x;
//     },
//     split: () => {
//       log('split()');
//       return seed.split().map((s, i) => loggingSeedDecorator(s, [...idPath, i === 0 ? 'L' : 'R'])) as [Seed, Seed];
//     },
//   };
// };

// const seed = loggingSeedDecorator(Seed.create(0));

// const specimens2 = Specimens.integer(IntegerRange.constant(0, 10))
//   .filter((x) => x > 10)
//   .generateSpecimens(seed, 50, 10);

// for (const s of specimens2) {
//   console.log(s);
// }
