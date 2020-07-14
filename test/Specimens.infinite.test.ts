import * as S from '../src/Specimens';
import { sample } from './Util';

describe('Specimens.infinite', () => {
  test('It does not hang =/', () => {
    const specimens = S.infinite(0);

    sample(specimens, 1);
  });
});
