import { Specimens, IntegerRange } from '../src';

Specimens.zip(Specimens.integer(IntegerRange.constant(0, 10)), Specimens.constant(1))
  .map(([x, y]) => [x, y, x * y])
  .print(50, 20);
