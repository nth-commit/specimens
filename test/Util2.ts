import { Seed, Specimens, MaybeExhaustedSpecimen } from '../src';
import { RoseTreeExtensions, EvaluatedTree } from './Util';

export const DEFAULT_SIZE = 50;

export const sample = <T>(specimens: Specimens<T>, count: number, size: number = DEFAULT_SIZE): T[] =>
  Array.from(specimens.sample(size, count));

export const sampleSpecimens = <T>(
  specimens: Specimens<T>,
  count: number,
  size: number = DEFAULT_SIZE,
): Array<MaybeExhaustedSpecimen<T>> => Array.from(specimens.sampleSpecimens(size, count));

export const generate = <T>(specimens: Specimens<T>, seed: Seed, count: number, size: number = DEFAULT_SIZE): T[] =>
  Array.from(specimens.generate(seed, size, count));

export const generateOne = <T>(specimens: Specimens<T>, seed: Seed, size: number = DEFAULT_SIZE): T =>
  generate(specimens, seed, 1, size)[0];

export const generateSpecimens = <T>(
  specimens: Specimens<T>,
  seed: Seed,
  count: number,
  size: number = DEFAULT_SIZE,
): Array<MaybeExhaustedSpecimen<T>> => Array.from(specimens.generateSpecimens(seed, size, count));

export const generateTrees = <T>(
  specimens: Specimens<T>,
  seed: Seed,
  count: number,
  size: number = DEFAULT_SIZE,
): Array<EvaluatedTree<T>> => Array.from(specimens.generateTrees(seed, size, count).map(RoseTreeExtensions.evaluate));

export const generateOneTree = <T>(
  specimens: Specimens<T>,
  seed: Seed,
  size: number = DEFAULT_SIZE,
): EvaluatedTree<T> => generateTrees(specimens, seed, 1, size)[0];
