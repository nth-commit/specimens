export const Unfolded = Symbol();

export class Sequence<T> {
  static terminated = <U>(): Sequence<U> =>
    new Sequence<U>(function* () {
      return;
    });

  static infinite = (): Sequence<BigInt> =>
    new Sequence(function* () {
      let count = 0n;
      while (true) {
        yield count++;
      }
    });

  static from = <U>(arr: Array<U>): Sequence<U> => {
    return new Sequence(function* () {
      yield* arr;
    });
  };

  static singleton = <U>(x: U): Sequence<U> =>
    new Sequence<U>(function* () {
      yield x;
    });

  static empty = <U>(): Sequence<U> =>
    new Sequence<U>(function* () {
      yield* [];
    });

  static unfold = <U>(unfolder: (x: U) => U | typeof Unfolded, seed: U): Sequence<U> =>
    new Sequence<U>(function* () {
      let current: U | typeof Unfolded = seed;
      while (current !== Unfolded) {
        yield current;
        current = unfolder(current);
      }
    });

  [Symbol.iterator]() {
    return this.generatorFactory();
  }

  constructor(private generatorFactory: () => Generator<T>) {}

  map<U>(f: (x: T) => U): Sequence<U> {
    const generator = this.generatorFactory();
    return new Sequence(function* () {
      for (const x of generator) {
        yield f(x);
      }
    });
  }

  bind<U>(f: (x: T) => Sequence<U>): Sequence<U> {
    const generator = this.generatorFactory();
    return new Sequence(function* () {
      for (const x of generator) {
        for (const y of f(x)) {
          yield y;
        }
      }
    });
  }

  expand<U>(f: (x: T) => Generator<U>): Sequence<U> {
    const generator = this.generatorFactory();
    return new Sequence(function* () {
      for (const x of generator) {
        for (const y of f(x)) {
          yield y;
        }
      }
    });
  }

  filter<U extends T>(pred: (value: T) => value is U): Sequence<U>;
  filter(pred: (value: T) => boolean): Sequence<T>;
  filter(pred: (x: T) => boolean): Sequence<T> {
    const generator = this.generatorFactory();
    return new Sequence(function* () {
      for (const x of generator) {
        if (pred(x)) {
          yield x;
        }
      }
    });
  }

  takeWhile<U extends T>(pred: (value: T) => value is U): Sequence<U>;
  takeWhile(pred: (value: T) => boolean): Sequence<T>;
  takeWhile(pred: (x: T) => boolean): Sequence<T> {
    const generator = this.generatorFactory();
    return new Sequence(function* () {
      for (const x of generator) {
        if (pred(x)) {
          yield x;
        } else {
          break;
        }
      }
    });
  }

  skip(count: number): Sequence<T> {
    const generator = this.generatorFactory();
    return new Sequence(function* () {
      for (let i = 0; i < count; i++) {
        generator.next();
      }
      yield* generator;
    });
  }

  take(count: number): Sequence<T> {
    const generator = this.generatorFactory();
    return new Sequence(function* () {
      for (let i = 0; i < count; i++) {
        yield generator.next().value;
      }
    });
  }

  cons(head: T): Sequence<T> {
    const generator = this.generatorFactory();
    return new Sequence<T>(function* () {
      yield head;
      yield* generator;
    });
  }

  concat(s: Sequence<T>): Sequence<T> {
    const generator = this.generatorFactory();
    return new Sequence<T>(function* () {
      yield* generator;
      yield* s;
    });
  }

  isEmpty(): boolean {
    return this.generatorFactory().next().done === true;
  }

  toArray(): Array<T> {
    return Array.from(this.generatorFactory());
  }

  toGenerator(): Generator<T> {
    return this.generatorFactory();
  }
}

export default Sequence;
