import { mean, sampleSkewness, min, max } from 'simple-statistics';
import { Seed, Specimens, Exhausted, Specimen } from '../src';
import { sampleSpecimens, sample, generateSpecimens } from './Util';

describe('Specimens.item', () => {
  test('Given an empty array, it exhausts', () => {
    const arr: unknown[] = [];

    const results = sampleSpecimens(Specimens.item(arr), 100);

    expect(results).toContain(Exhausted);
  });

  test('Given a non-empty array, all specimens are accepted', () => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const results = sampleSpecimens(Specimens.item(arr), 100);

    expect(results).toHaveLength(100);
    results.forEach((x) => expect(x !== Exhausted && Specimen.isAccepted(x)).toEqual(true));
  });

  test('All specimens are items in the array', () => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const results = sample(Specimens.item(arr), 100);

    results.forEach((x) => expect(arr).toContain(x));
  });

  test('Specimens are evenly distributed', () => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const results = sample(Specimens.item(arr), 10000);

    expect(mean(results)).toBeGreaterThan(4.9);
    expect(mean(results)).toBeLessThan(5.1);
    expect(Math.abs(sampleSkewness(results))).toBeLessThan(0.1);
  });

  test('Specimens occupy the range', () => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const results = sample(Specimens.item(arr), 10000);

    expect(min(results)).toEqual(min(arr));
    expect(max(results)).toEqual(max(arr));
  });

  test('Specimens are repeatable', () => {
    const seed = Seed.spawn();
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const run = () => generateSpecimens(Specimens.item(arr), seed, 100);

    expect(run()).toEqual(run());
  });
});
