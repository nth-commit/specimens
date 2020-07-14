import S from './Specimens';
import Seed from '../Seed';
import { Size } from '../Range';

export type StatisticsConfig = {
  specimenSeed: Seed;
  specimenSize: Size;
  sampleSize: number;
};

export type Statistics = Record<string, number>;

const mapRecord = <T, U>(record: Record<string, T>, f: (x: T, key: string) => U): Record<string, U> => {
  return Object.keys(record)
    .map<[string, U]>((key) => [key, f(record[key], key)])
    .reduce((newRecord, [key, y]) => {
      newRecord[key] = y;
      return newRecord;
    }, {} as Record<string, U>);
};

export const statistics = <T>(
  specimens: S<T>,
  classifier: (x: T) => string,
  conf: Partial<StatisticsConfig> = {},
): Statistics => {
  const seed = conf.specimenSeed || Seed.spawn();
  const size = conf.specimenSize || 30;
  const sampleSize = conf.sampleSize || 100;

  const classifiedCounts = specimens.generate(seed, size, sampleSize).reduce((acc, curr) => {
    const key = classifier(curr);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return mapRecord(classifiedCounts, (count) => count / sampleSize);
};

export const printStatistics = <T>(
  specimens: S<T>,
  classifier: (x: T) => string,
  conf: Partial<StatisticsConfig> = {},
): void => {
  const results = statistics(specimens, classifier, conf);
  const tabularResults = Object.entries(results)
    .map(([groupName, percentage]) => ({ groupName, percentage }))
    .sort((a, b) => b.percentage - a.percentage)
    .map(({ groupName, percentage }) => ({ groupName, percentage: `${percentage.toFixed(2)}%` }));
  console.table(tabularResults);
};
