import { Specimens } from '../src';
import { sample } from './Util';

describe('Specimens.infinite', () => {
  test('It does not hang', () => {
    const specimens = Specimens.infinite(0);

    sample(specimens, 1);
  });
});
