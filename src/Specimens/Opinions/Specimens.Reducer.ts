import { Specimens as S } from '../Specimens';
import { WeightedSpecimens, pickSpecimensWeighted } from '../Specimens.Primitives';
import { fromStateMachine, EventSpecimens } from '../Specimens.Machinery';

export const ReducerMustTerminate = Symbol('Terminated');
export const ActionNotApplicable = Symbol('InvalidTransition');

export type TryTransitionReducer<Action> =
  | WeightedSpecimens<Action>
  | typeof ActionNotApplicable
  | typeof ReducerMustTerminate;

export type TryPickReducerAction<State, Action> = (state: State) => TryTransitionReducer<Action>;

export type TryTransitionReducerDef<State, Action> = typeof ActionNotApplicable | TryPickReducerAction<State, Action>;

export type TryTransitionReducerDefs<State, Action extends { type: string }> = {
  [P in Action['type']]: TryTransitionReducerDef<State, Action>;
};

const isNotUndefined = <T>(x: T | undefined): x is T => x !== undefined;

const makeActionSpecimens = <State, Action extends { type: string }>(
  actions: TryTransitionReducerDefs<State, Action>,
): EventSpecimens<State, Action> => {
  const tryTransitionReducerDefs = Object.values(actions).filter((d) => d !== ActionNotApplicable) as Array<
    TryPickReducerAction<State, Action>
  >;

  return (state) =>
    pickSpecimensWeighted(
      tryTransitionReducerDefs
        .map((d) => {
          const maybeActionSpecimen = d(state);
          return maybeActionSpecimen === ActionNotApplicable || maybeActionSpecimen === ReducerMustTerminate
            ? undefined
            : maybeActionSpecimen;
        })
        .filter(isNotUndefined),
    );
};

export const fromReducer = <State, Action extends { type: string }>(
  initialState: State,
  reducer: (s: State, a: Action) => State,
  actions: TryTransitionReducerDefs<State, Action>,
): S<{ state: State; action: Action }> =>
  fromStateMachine(initialState, reducer, makeActionSpecimens(actions)).map(({ state, event: action }) => ({
    state,
    action,
  }));
