import Specimens from './Specimens';
import { constant, pickElement } from './Specimens.Primitives';
import { concat } from './Specimens.Combinations';

export const scan = <T>(initial: T, generator: (prev: T) => Specimens<T>): Specimens<T> =>
  generator(initial).bind((x) => concat(constant(x), scan(x, generator)));

export type Transition<State, Event> = (s: State, e: Event) => State;

export type EventSpecimens<State, Event> = (s: State) => Specimens<Event>;

export const fromStateMachine = <State, Event>(
  initialState: State,
  transition: (s: State, e: Event) => State,
  eventSpecimens: EventSpecimens<State, Event>,
): Specimens<{ state: State; event: Event }> =>
  scan({ state: initialState, event: null as any }, ({ state }) =>
    eventSpecimens(state).map((event) => ({
      state: transition(state, event),
      event,
    })),
  );
