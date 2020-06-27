import { Shrink, Integer } from '../src';

describe('Shrink.towards', () => {
  type ShrinkTowardsTest<N> = {
    subject: N;
    destination: N;
    expectedShrinks: N[];
  };

  test.each`
    subject | destination | expectedShrinks
    ${64}   | ${0}        | ${[0, 32, 16, 8, 4, 2, 1]}
    ${74}   | ${10}       | ${[10, 42, 26, 18, 14, 12, 11]}
    ${-64}  | ${0}        | ${[0, -32, -16, -8, -4, -2, -1]}
  `('<integer>', ({ subject, destination, expectedShrinks }: ShrinkTowardsTest<number>) => {
    const shrinker = Shrink.towards(Integer, destination);

    const shrinks = shrinker(subject);

    expect(shrinks.toArray()).toEqual(expectedShrinks);
  });
});
