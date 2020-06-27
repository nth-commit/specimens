import { Specimens, IntegerRange, Specimen, Seed, Shrink, Integer } from '../src';

for (const x of Specimens.integer(IntegerRange.constant(0, 100)).sample(10000, 10)) {
  console.log(x);
}

console.log(Shrink.towards(Integer, 0)(100).toArray());

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
