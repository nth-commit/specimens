export type AcceptedSpecimen<T> = {
  kind: 'accepted';
  value: T;
};

export type RejectedSpecimen = {
  kind: 'rejected';
};

export type Specimen<T> = AcceptedSpecimen<T> | RejectedSpecimen;

export namespace Specimen {
  export const accepted = <T>(x: T): Specimen<T> => ({ kind: 'accepted', value: x });
  export const rejected = <T>(): Specimen<T> => ({ kind: 'rejected' });

  export const isAccepted = <T>(s: Specimen<T>): s is AcceptedSpecimen<T> => s.kind === 'accepted';
  export const isRejected = <T>(s: Specimen<T>): s is RejectedSpecimen => s.kind === 'rejected';

  export const getValue = <T>(s: AcceptedSpecimen<T>): T => s.value;
  export const getValueUnsafe = <T>(s: Specimen<T>): T => {
    if (s.kind === 'rejected') throw 'Expected accepted';
    return getValue(s);
  };

  export const map = <T, U>(s: Specimen<T>, f: (x: T) => U): Specimen<U> => (isAccepted(s) ? accepted(f(s.value)) : s);

  export const bind = <T, U>(s: Specimen<T>, f: (x: T) => Specimen<U>): Specimen<U> => (isAccepted(s) ? f(s.value) : s);

  export const unwrap = <TInner, TMatchAccepted, TMatchRejected>(
    s: Specimen<TInner>,
    onAccepted: (x: TInner) => TMatchAccepted,
    onRejected: () => TMatchRejected,
  ): TMatchAccepted | TMatchRejected => (s.kind === 'accepted' ? onAccepted(s.value) : onRejected());
}

export default Specimen;
