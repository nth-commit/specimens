import { Specimens, IntegerRange, Specimen } from '../src';
import { from } from 'ix/iterable';
import { flatMap } from 'ix/iterable/operators';

import { Sequence } from '../src/Sequence';

const specimens = Specimens.integer(IntegerRange.constant(0, 10)).sample(50, 10);

for (const s of specimens) {
  console.log(s);
}
