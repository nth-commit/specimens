import { Seed } from '../src';

test('Split is a repeatable', () => {
  const s0 = Seed.spawn();
  const [s1, s2] = s0.split();

  expect(s0.split()[0].nextInt(0, 1000)).toEqual(s1.nextInt(0, 1000));
  expect(s0.split()[1].nextInt(0, 1000)).toEqual(s2.nextInt(0, 1000));
});
