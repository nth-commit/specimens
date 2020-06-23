import { Specimens, IntegerRange, Specimen } from '../src';

import { Sequence } from '../src/Sequence';

Specimens.integer(IntegerRange.constant(0, 10))
  .filter((x) => x % 2 === 0)
  .filter((x) => x % 3 === 0)
  .sample(50, 100000);

Specimens.zip(Specimens.integer(IntegerRange.constant(0, 10)), Specimens.constant(1))
  .map(([x, y]) => [x, y, x * y])
  .print(50, 20);

const seq = Sequence.unfold((x) => x + 2, 1).map((x) => x + 1);

Array.from(seq.take(5)).forEach((x) => console.log(x));

// Specimens.constant(1).sample(50, 100000);
