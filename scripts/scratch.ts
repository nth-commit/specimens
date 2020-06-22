import { Specimens, Sequence, IntegerRange, integer, Specimen } from '../src';

// Specimens.integer(IntegerRange.constant(0, 10))
//   .bind((x) => integer(IntegerRange.constant(0, 10)).map((y) => [x, y, x * y]))
//   .print(50, 20);

Specimens.integer(IntegerRange.constant(0, 10))
  .filter((x) => x % 2 === 0)
  .print(50, 30);
