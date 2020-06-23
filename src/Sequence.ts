import { IterableX, generate, from, of, empty, concat, toArray } from 'ix/iterable';
import { skip, take, map, filter, flatMap, takeWhile } from 'ix/iterable/operators';
import { OperatorFunction } from 'ix/interfaces';

export class TakeWhileInclusiveIterable<TSource> extends IterableX<TSource> {
  private _source: Iterable<TSource>;
  private _predicate: (value: TSource, index: number) => boolean;

  constructor(source: Iterable<TSource>, predicate: (value: TSource, index: number) => boolean) {
    super();
    this._source = source;
    this._predicate = predicate;
  }

  *[Symbol.iterator]() {
    let i = 0;
    for (const item of this._source) {
      yield item;
      if (!this._predicate(item, i++)) {
        break;
      }
    }
  }
}

export function takeWhileInclusive<T, S extends T>(
  predicate: (value: T, index: number) => value is S,
): OperatorFunction<T, S>;
export function takeWhileInclusive<T>(predicate: (value: T, index: number) => boolean): OperatorFunction<T, T>;
export function takeWhileInclusive<T>(predicate: (value: T, index: number) => boolean): OperatorFunction<T, T> {
  return function takeWhileInclusiveOperatorFunction(source: Iterable<T>): IterableX<T> {
    return new TakeWhileInclusiveIterable<T>(source, predicate);
  };
}

export class Sequence<T> implements Iterable<T> {
  static infinite(): Sequence<bigint> {
    return new Sequence(
      generate(
        0n,
        () => true,
        (n) => n + 1n,
        (n) => n,
      ),
    );
  }

  static from<U>(source: Iterable<U> | Iterator<U> | ArrayLike<U>): Sequence<U> {
    return new Sequence(from(source));
  }

  static singleton<U>(x: U): Sequence<U> {
    return new Sequence(of(x));
  }

  static empty<U>(): Sequence<U> {
    return new Sequence(empty());
  }

  static concat<U>(s1: Sequence<U>, s2: Sequence<U>): Sequence<U> {
    return new Sequence(concat(s1, s2));
  }

  static unfold<U>(unfolder: (x: U) => U | undefined, seed: U): Sequence<U> {
    return new Sequence(
      generate(
        seed,
        (x) => x !== undefined,
        (x) => unfolder(x) as U,
        (x) => x,
      ),
    );
  }

  [Symbol.iterator]() {
    return this.iterable[Symbol.iterator]();
  }

  constructor(private iterable: IterableX<T>) {}

  skip(n: number): Sequence<T> {
    return new Sequence<T>(this.iterable.pipe(skip(n)));
  }

  take(n: number): Sequence<T> {
    return new Sequence<T>(this.iterable.pipe(take(n)));
  }

  takeWhile<U extends T>(pred: (value: T) => value is U): Sequence<U>;
  takeWhile(pred: (value: T) => boolean): Sequence<T>;
  takeWhile(pred: (x: T) => boolean): Sequence<T> {
    return new Sequence<T>(this.iterable.pipe(takeWhile(pred)));
  }

  takeWhileInclusive(pred: (x: T) => boolean): Sequence<T> {
    return new Sequence<T>(this.iterable.pipe(takeWhileInclusive(pred)));
  }

  map<U>(f: (x: T) => U): Sequence<U> {
    return new Sequence<U>(this.iterable.pipe(map(f)));
  }

  bind<U>(f: (x: T) => Sequence<U>) {
    return new Sequence<U>(this.iterable.pipe(flatMap(f)));
  }

  expand<U>(f: (x: T) => Generator<U>) {
    return this.bind((x) => Sequence.from(f(x)));
  }

  filter<U extends T>(pred: (value: T) => value is U): Sequence<U>;
  filter(pred: (value: T) => boolean): Sequence<T>;
  filter(pred: (x: T) => boolean): Sequence<T> {
    return new Sequence(this.iterable.pipe(filter(pred)));
  }

  toArray(): Array<T> {
    return toArray(this.iterable);
  }
}

export default Sequence;
