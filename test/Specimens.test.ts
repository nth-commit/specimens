import { mean, sampleSkewness, min, max } from 'simple-statistics';
import { Seed, Specimens, Exhausted, IntegerRange, Specimen } from '../src';

const SIZE = 50;

const setDifference = <T>(a: Set<T>, b: Set<T>): Set<T> => {
  return new Set([...a].filter((x) => !b.has(x)));
};

test('Specimens.map', () => {
  const specimens = Specimens.integer(IntegerRange.constant(0, 0)).map((x) => x + 1);

  const results = new Set(specimens.sampleAccepted(SIZE, 100));

  results.forEach((x) => expect(x).toStrictEqual(1));
});

describe('Specimens.filter', () => {
  test('Given an impossible predicate, sampling specimens exhausts', () => {
    const specimens = Specimens.integer(IntegerRange.constant(0, 0)).filter(() => false);

    const results = new Set(specimens.sample(SIZE, 100));

    expect(results).toContain(Exhausted);
  });

  test('Given an impossible predicate, sampling accepted specimens returns empty', () => {
    const specimens = Specimens.integer(IntegerRange.constant(0, 0)).filter(() => false);

    const results = new Set(specimens.sampleAccepted(SIZE, 100));

    expect(results.size).toEqual(0);
  });

  test('Accepted specimens pass the predicate', () => {
    const predicate = (x: number): boolean => x % 2 === 0;
    const filteredSpecimens = Specimens.integer(IntegerRange.constant(0, 10)).filter(predicate);

    const passingResults = new Set(filteredSpecimens.sampleAccepted(SIZE, 100));

    passingResults.forEach((x) => expect(predicate(x)).toStrictEqual(true));
  });

  test('Skipped specimens fail the predicate', () => {
    const predicate = (x: number): boolean => x % 2 === 0;
    const unfilteredSpecimens = Specimens.integer(IntegerRange.constant(0, 10));
    const filteredSpecimens = unfilteredSpecimens.filter(predicate);

    const failingResults = setDifference(
      new Set(unfilteredSpecimens.sampleAccepted(SIZE, 100)),
      new Set(filteredSpecimens.sampleAccepted(SIZE, 100)),
    );

    failingResults.forEach((x) => expect(predicate(x)).toStrictEqual(false));
  });
});

describe('Specimens.zip', () => {
  const range1 = IntegerRange.constant(1, 10);
  const specimens1 = Specimens.integer(range1);

  const range2 = IntegerRange.constant(11, 20);
  const specimens2 = Specimens.integer(range2);

  test('Given all element specimens are accepted, result specimens are accepted', () => {
    const results = Array.from(Specimens.zip(specimens1, specimens2).sample(SIZE, 100));

    results.forEach((x) => expect(Specimen.isAccepted(x)).toEqual(true));
  });

  test.skip('All specimens are a product of their elements', () => {
    const results = Array.from(Specimens.zip(specimens1, specimens2).sampleAccepted(SIZE, 100));

    results.forEach(([r1, r2]) => {
      const [min1, max1] = IntegerRange.bounds(SIZE, range1);
      expect(r1).toBeLessThanOrEqual(max1);
      expect(r1).toBeGreaterThanOrEqual(min1);

      const [min2, max2] = IntegerRange.bounds(SIZE, range2);
      expect(r2).toBeLessThanOrEqual(max2);
      expect(r2).toBeGreaterThanOrEqual(min2);
    });
  });
});

describe('Specimens.integer', () => {
  const range = IntegerRange.constant(0, 10);

  test('All specimens are accepted', () => {
    const results = Array.from(Specimens.integer(range).sample(SIZE, 100));

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
    const results = Array.from(Specimens.integer(range).sampleAccepted(SIZE, 10000));

    expect(mean(results)).toBeGreaterThan(4.75);
    expect(mean(results)).toBeLessThan(5.25);
    expect(Math.abs(sampleSkewness(results))).toBeLessThan(0.1);
  });

  test('Specimens occupy the range', () => {
    const results = Array.from(Specimens.integer(range).sampleAccepted(SIZE, 10000));

    const [expectedMin, expectedMax] = IntegerRange.bounds(SIZE, range);
    expect(min(results)).toEqual(expectedMin);
    expect(max(results)).toEqual(expectedMax);
  });

  test('Specimens are repeatable', () => {
    const seed = Seed.spawn();

    const sample = () => Array.from(Specimens.integer(range).runAccepted(seed, SIZE, 100));

    expect(sample()).toEqual(sample());
  });
});

describe('Specimens.item', () => {
  test('Given an empty array, it immediately exhausts', () => {
    const arr: unknown[] = [];

    const results = Array.from(Specimens.item(arr).sample(10, 100));

    expect(results).toEqual([Exhausted]);
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

    const results = Array.from(Specimens.item(arr).sampleAccepted(SIZE, 10000));

    expect(mean(results)).toBeGreaterThan(4.75);
    expect(mean(results)).toBeLessThan(5.25);
    expect(Math.abs(sampleSkewness(results))).toBeLessThan(0.1);
  });

  test('Specimens occupy the range', () => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const results = Array.from(Specimens.item(arr).sampleAccepted(SIZE, 10000));

    expect(min(results)).toEqual(min(arr));
    expect(max(results)).toEqual(max(arr));
  });

  test('Specimens are repeatable', () => {
    const seed = Seed.spawn();
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const sample = () => Array.from(Specimens.item(arr).run(seed, SIZE, 100));

    expect(sample()).toEqual(sample());
  });
});
