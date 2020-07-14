import Specimens from './Specimens';
import { constant, item } from './Specimens.Primitives';
import { concat } from './Specimens.Combinations';

export const scan = <T>(initial: T, generator: (prev: T) => Specimens<T>): Specimens<T> =>
  generator(initial).bind((x) => concat(constant(x), scan(x, generator)));

export const fromStateMachine = <State, Action>(
  initialState: State,
  transition: (s: State, a: Action) => State,
  generateAction: (s: State) => Specimens<Action>,
): Specimens<State> => scan<State>(initialState, (s) => generateAction(s).map((a) => transition(s, a)));

export const Terminated = Symbol('Terminated');
export const InvalidTransition = Symbol('InvalidTransition');

export type ReducerTransition<Action> = Specimens<Action> | typeof InvalidTransition | typeof Terminated;

export type ReducerTransitionSpec<State, Action> =
  | typeof InvalidTransition
  | ((state: State) => ReducerTransition<Action>);

export type ReducerTransitionSpecs<State, Action extends { type: string }> = {
  [P in Action['type']]: ReducerTransitionSpec<State, Action>;
};

export const fromReducer = <State, Action extends { type: string }>(
  initialState: State,
  reducer: (s: State, a: Action) => State,
  actions: ReducerTransitionSpecs<State, Action>,
): Specimens<State> => {
  const generateAction = (state: State): Specimens<Action> => {
    const isNotUndefined = <T>(x: T | undefined): x is T => x !== undefined;

    const actionSpecimensDefinitions = Object.values(actions) as Array<ReducerTransitionSpec<State, Action>>;

    const applicableActionSpecimenDefinitions = actionSpecimensDefinitions
      .map((actionSpecimenDefinition) => {
        if (actionSpecimenDefinition === InvalidTransition) {
          return undefined;
        }

        const result = actionSpecimenDefinition(state);
        if (result === InvalidTransition || result === Terminated) {
          return undefined;
        }

        return result;
      })
      .filter(isNotUndefined);

    return item(applicableActionSpecimenDefinitions).bind((x) => x);
  };

  return fromStateMachine(initialState, reducer, generateAction);
};
