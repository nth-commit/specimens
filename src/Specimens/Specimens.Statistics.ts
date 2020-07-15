import S from './Specimens';
import Seed from '../Seed';
import { Size } from '../Range';
import { Exhausted } from '../ExhaustionStrategy';

export type StatisticsConfig = {
  specimenSeed: Seed;
  specimenSize: Size;
  sampleSize: number;
};

export type Classification = {
  count: number;
  percentage: number;
};

export type Statistics<K extends string = string> = {
  sampleSize: number;
  classifications: Record<K, Classification>;
};

const mapRecord = <T, U>(record: Record<string, T>, f: (x: T, key: string) => U): Record<string, U> => {
  return Object.keys(record)
    .map<[string, U]>((key) => [key, f(record[key], key)])
    .reduce((newRecord, [key, y]) => {
      newRecord[key] = y;
      return newRecord;
    }, {} as Record<string, U>);
};

const resolveConf = (conf: Partial<StatisticsConfig>): StatisticsConfig => ({
  specimenSeed: conf.specimenSeed || Seed.spawn(),
  specimenSize: conf.specimenSize || 30,
  sampleSize: conf.sampleSize || 100,
});

const toClassification = (count: number, sampleSize: number): Classification => ({
  count,
  percentage: count / sampleSize,
});

export const statistics = <T>(
  specimens: S<T>,
  classifier: (x: T) => string,
  conf: Partial<StatisticsConfig> = {},
): Statistics => {
  const { specimenSeed, specimenSize, sampleSize } = resolveConf(conf);

  const classifiedCounts = specimens.generate(specimenSeed, specimenSize, sampleSize).reduce((acc, curr) => {
    const key = classifier(curr);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    sampleSize,
    classifications: mapRecord(classifiedCounts, (count) => toClassification(count, sampleSize)),
  };
};

export type MetaStatistics = Statistics<'accepted' | 'rejected'> & { exhausted: boolean };

export const metaStatistics = <T>(specimens: S<T>, conf: Partial<StatisticsConfig> = {}): MetaStatistics => {
  const { specimenSeed, specimenSize, sampleSize } = resolveConf(conf);

  const classifiedCounts = specimens.generateSpecimens(specimenSeed, specimenSize, sampleSize).reduce(
    (acc, curr) => {
      if (curr === Exhausted) {
        return {
          ...acc,
          exhausted: true,
        };
      }

      acc[curr.kind] = acc[curr.kind] + 1;
      return acc;
    },
    { accepted: 0, rejected: 0, exhausted: false },
  );

  const actualSampleSize = classifiedCounts.accepted + classifiedCounts.rejected;
  return {
    sampleSize: actualSampleSize,
    classifications: {
      accepted: toClassification(classifiedCounts.accepted, actualSampleSize),
      rejected: toClassification(classifiedCounts.rejected, actualSampleSize),
    },
    exhausted: classifiedCounts.exhausted,
  };
};

type Row = {
  name: string;
  count: number;
  percentage?: string;
};

const classificationAsRow = (name: string, classification: Classification): Row => ({
  name,
  count: classification.count,
  percentage: `${(classification.percentage * 100).toFixed(2)}%`,
});

const statisticsAsTable = (results: Statistics): Row[] => [
  ...Object.entries(results.classifications)
    .map(([name, classification]) => classificationAsRow(name, classification))
    .sort((a, b) => b.count - a.count),
  { name: 'total', count: results.sampleSize },
];

export const printStatistics = <T>(
  specimens: S<T>,
  classifier: (x: T) => string,
  conf: Partial<StatisticsConfig> = {},
): void => {
  const results = statistics(specimens, classifier, conf);
  console.table(statisticsAsTable(results));
};

export const printMetaStatistics = <T>(specimens: S<T>, conf: Partial<StatisticsConfig> = {}): void => {
  const results = metaStatistics(specimens, conf);
  console.table(statisticsAsTable(results));
  if (results.exhausted) {
    console.log(`Exhausted after ${results.sampleSize} samples`);
  }
};
