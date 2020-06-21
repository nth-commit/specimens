import { mean, sampleSkewness, min, max } from 'simple-statistics';
import { Seed, Specimens, Exhausted, IntegerRange, Specimen } from '../src';

const SIZE = 50;

describe('Specimens.filter', () => {
  test('Given an impossible predicate, sampling specimens exhausts', () => {
    const specimens = Specimens.integer(IntegerRange.constant(0, 0));

    const results = Array.from(specimens.filter(() => false).sample(SIZE, 100));

    expect(results).toContain(Exhausted);
  });

  test('Given an impossible predicate, sampling accepted specimens returns empty', () => {
    const specimens = Specimens.integer(IntegerRange.constant(0, 0));

    const results = Array.from(specimens.filter(() => false).sampleAccepted(SIZE, 100));

    expect(results).toEqual([]);
  });
});

describe('Specimens.integer', () => {
  const range = IntegerRange.constant(0, 10);

  test('All specimens are accepted', () => {
    const results = Array.from(Specimens.integer(range).sampleAccepted(SIZE, 100));

    results.forEach((x) => expect(Specimen.isAccepted(x)).toEqual(true));
  });

  test('All specimens integers', () => {
    const results = Array.from(Specimens.integer(range).sampleAccepted(SIZE, 100));

    results.forEach((r) => expect(r).toStrictEqual(Math.round(r)));
  });

  test('All specimens are within the range', () => {
    const results = Array.from(Specimens.integer(range).sampleAccepted(SIZE, 100));

    results.forEach((r) => {
      const [min, max] = IntegerRange.bounds(SIZE, range);
      expect(r).toBeLessThanOrEqual(max);
      expect(r).toBeGreaterThanOrEqual(min);
    });
  });

  test('Specimens are evenly distributed', () => {
    const results = Array.from(Specimens.integer(range).sampleAccepted(SIZE, 100000));

    expect(mean(results)).toBeCloseTo(5, 1);
    expect(sampleSkewness(results)).toBeCloseTo(0, 1);
  });

  test('Specimens occupy the range', () => {
    const results = Array.from(Specimens.integer(range).sampleAccepted(SIZE, 1000));

    expect(min(results)).toEqual(0);
    expect(max(results)).toEqual(10);
  });

  test('Specimens are repeatable', () => {
    const seed = Seed.spawn();

    const sample = () => Array.from(Specimens.integer(range).runAccepted(seed, SIZE, 1000));

    expect(sample()).toEqual(sample());
  });
});

describe('Specimens.item', () => {
  test('Given an empty array, it immediately exhausts', () => {
    const arr: unknown[] = [];

    const results = Specimens.item(arr).sample(10, 100);

    expect(Array.from(results)).toEqual([Exhausted]);
  });

  test('Given a non-empty array, all specimens are accepted', () => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const results = Array.from(Specimens.item(arr).sample(SIZE, 100));

    results.forEach((x) => expect(Specimen.isAccepted(x)).toEqual(true));
  });

  test('All specimens are items in the array', () => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const results = Array.from(Specimens.item(arr).sampleAccepted(SIZE, 100));

    results.forEach((x) => expect(arr).toContain(x));
  });

  test('Specimens are evenly distributed', () => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const results = Array.from(Specimens.item(arr).sampleAccepted(SIZE, 100000));

    expect(mean(results)).toBeCloseTo(5, 1);
    expect(sampleSkewness(results)).toBeCloseTo(0, 1);
  });

  test('Specimens occupy the range', () => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const results = Array.from(Specimens.item(arr).sampleAccepted(SIZE, 1000));

    expect(min(results)).toEqual(0);
    expect(max(results)).toEqual(10);
  });

  test('Specimens are repeatable', () => {
    const seed = Seed.spawn();
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const sample = () => Array.from(Specimens.item(arr).run(seed, SIZE, 100));

    expect(sample()).toEqual(sample());
  });
});
