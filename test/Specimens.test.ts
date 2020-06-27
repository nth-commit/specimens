import { mean, sampleSkewness, min, max } from 'simple-statistics';
import { Seed, Specimens, Exhausted, IntegerRange, Specimen, SpecimensBuilder } from '../src';

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
  test('It exhausts with an impossible predicate', () => {
    const specimens = Specimens.integer(IntegerRange.constant(0, 0)).filter(() => false);

    const results = new Set(specimens.sample(SIZE, 100));

    expect(results).toContain(Exhausted);
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

  test('It is composable', () => {
    const predicateA = (x: number): boolean => x % 2 === 0;
    const predicateB = (x: number): boolean => x % 3 === 0;
    const specimens = Specimens.integer(IntegerRange.constant(1, 6));

    const seed = Seed.create(0);
    const run = (specimens: SpecimensBuilder<number>): Array<Specimen<number>> =>
      Array.from(specimens.run(seed, SIZE, 10));

    expect(run(specimens.filter(predicateA).filter(predicateB))).toEqual(
      run(specimens.filter((x) => predicateA(x) && predicateB(x))),
    );
  });

  test('It is commutative', () => {
    const predicateA = (x: number): boolean => x % 2 === 0;
    const predicateB = (x: number): boolean => x % 3 === 0;
    const specimens = Specimens.integer(IntegerRange.constant(1, 6));

    const seed = Seed.create(0);
    const run = (specimens: SpecimensBuilder<number>): Array<Specimen<number>> =>
      Array.from(specimens.run(seed, SIZE, 10));

    expect(run(specimens.filter(predicateA).filter(predicateB))).toEqual(
      run(specimens.filter(predicateB).filter(predicateA)),
    );
  });
});

describe('Specimens.zip', () => {
  test('It has equivalency with its left component', () => {
    const seed = Seed.spawn();
    const specimensLeft = Specimens.integer(IntegerRange.constant(1, 10));
    const specimensZipped = Specimens.zip(specimensLeft, Specimens.constant(0));

    const zippedResults = Array.from(specimensZipped.runAccepted(seed, SIZE, 10));
    const leftResults = Array.from(specimensLeft.runAccepted(seed, SIZE, 10));

    expect(zippedResults.map(([left]) => left)).toEqual(leftResults);
  });

  test('It has equivalency with its right component', () => {
    const seed = Seed.spawn();
    const specimensRight = Specimens.integer(IntegerRange.constant(1, 10));
    const specimensZipped = Specimens.zip(Specimens.constant(0), specimensRight);

    const zippedResults = Array.from(specimensZipped.runAccepted(seed, SIZE, 10));
    const rightResults = Array.from(specimensRight.runAccepted(seed, SIZE, 10));

    expect(zippedResults.map(([, right]) => right)).toEqual(rightResults);
  });

  test('It is exhausted if its left component is exhausted', () => {
    const specimens = Specimens.zip(Specimens.exhausted(), Specimens.constant(0));

    const results = Array.from(specimens.sample(SIZE, 1));

    expect(results).toEqual([Exhausted]);
  });

  test('It is exhausted if its right component is exhausted', () => {
    const specimens = Specimens.zip(Specimens.constant(0), Specimens.exhausted());

    const results = Array.from(specimens.sample(SIZE, 1));

    expect(results).toEqual([Exhausted]);
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

    expect(mean(results)).toBeGreaterThan(4.9);
    expect(mean(results)).toBeLessThan(5.1);
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

    expect(mean(results)).toBeGreaterThan(4.9);
    expect(mean(results)).toBeLessThan(5.1);
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
