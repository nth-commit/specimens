import { Specimens, IntegerRange, Seed } from '../src';

test('debug', () => {
  const s = Specimens.unfold(0, (count) =>
    count > 50 ? Specimens.rejected() : Specimens.integer(IntegerRange.constant(0, 10)).map((x) => x + count),
  );

  for (const x of s.generateSpecimens(Seed.spawn(), 30, 20)) {
    console.log(x);
  }
});
