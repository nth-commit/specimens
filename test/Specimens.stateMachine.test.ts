import { Specimens, Seed, Exhausted, Specimen, IntegerRange } from '../src';
import { generateSpecimens } from './Util';

type TodoListAction =
  | { type: 'add'; id: string; text: string }
  | { type: 'delete'; id: string }
  | { type: 'toggle'; id: string }
  | { type: 'move'; id: string; toIndex: number };

type TodoState = {
  checked: boolean;
  text: string;
};

type TodoListOkState = {
  type: 'ok';
  todoOrder: string[];
  todosById: Record<string, TodoState>;
};

type TodoListErrorState = {
  type: 'fail';
  reason: string;
  state: TodoListState;
  invalidAction: TodoListAction;
};

type TodoListState = TodoListOkState | TodoListErrorState;

const INITIAL_STATE: TodoListState = {
  type: 'ok',
  todoOrder: [],
  todosById: {},
};

const todoListReducer = (state: TodoListState, action: TodoListAction): TodoListState => {
  if (state.type === 'fail') {
    return state;
  }

  const failWith = (reason: string): TodoListState => ({
    type: 'fail',
    reason,
    state,
    invalidAction: action,
  });

  switch (action.type) {
    case 'add': {
      if (state.todoOrder.includes(action.id)) {
        return failWith('Duplicate id');
      }

      return {
        type: 'ok',
        todoOrder: [...state.todoOrder, action.id],
        todosById: {
          ...state.todosById,
          [action.id]: {
            text: action.text,
            checked: false,
          },
        },
      };
    }
    case 'delete': {
      if (state.todoOrder.includes(action.id) === false) {
        return failWith('Non-existent id');
      }

      const todosById = { ...state.todosById };
      delete todosById[action.id];
      return {
        type: 'ok',
        todoOrder: state.todoOrder.filter((id) => id !== action.id),
        todosById,
      };
    }
    case 'toggle': {
      if (state.todoOrder.includes(action.id) === false) {
        return failWith('Non-existent id');
      }

      return {
        type: 'ok',
        todoOrder: state.todoOrder,
        todosById: {
          ...state.todosById,
          [action.id]: {
            ...state.todosById[action.id],
            checked: !state.todosById[action.id].checked,
          },
        },
      };
    }
    case 'move': {
      if (state.todoOrder.includes(action.id) === false) {
        return failWith('Non-existent id');
      }

      const currentIx = state.todoOrder.indexOf(action.id);
      const todoOrder = [...state.todoOrder];
      todoOrder.splice(currentIx, 1);
      todoOrder.splice(action.toIndex, 0, action.id);

      return {
        type: 'ok',
        todosById: state.todosById,
        todoOrder,
      };
    }
  }
};

describe('Specimens.stateMachine', () => {
  describe('Pre-assertions: todoListReducer', () => {
    test('Adding an item fails if the ID already exists', () => {
      const action: TodoListAction = { type: 'add', id: '1', text: '' };
      const initialState = todoListReducer(INITIAL_STATE, action);

      const state = todoListReducer(initialState, action);

      expect(state).toMatchObject({
        type: 'fail',
        reason: 'Duplicate id',
      });
    });

    test('Deleting an item fails if an item with that ID does not exist', () => {
      const action: TodoListAction = { type: 'delete', id: '1' };
      const initialState = INITIAL_STATE;

      const state = todoListReducer(initialState, action);

      expect(state).toMatchObject({
        type: 'fail',
        reason: 'Non-existent id',
      });
    });

    test('Toggling an item fails if an item with that ID does not exist', () => {
      const action: TodoListAction = { type: 'toggle', id: '1' };
      const initialState = INITIAL_STATE;

      const state = todoListReducer(initialState, action);

      expect(state).toMatchObject({
        type: 'fail',
        reason: 'Non-existent id',
      });
    });

    test('Moving an item fails if an item with that ID does not exist', () => {
      const action: TodoListAction = { type: 'move', id: '1', toIndex: 0 };
      const initialState = INITIAL_STATE;

      const state = todoListReducer(initialState, action);

      expect(state).toMatchObject({
        type: 'fail',
        reason: 'Non-existent id',
      });
    });
  });

  const terminateIfFailedOr = (
    continueWith: (s: TodoListOkState) => Specimens.ActionSpecimenDefinitionResult<TodoListAction>,
  ) => (state: TodoListState): Specimens.ActionSpecimenDefinitionResult<TodoListAction> =>
    state.type === 'fail' ? Specimens.Terminated : continueWith(state);

  const reducerSpecimens = Specimens.fromReducer(INITIAL_STATE, todoListReducer, {
    add: terminateIfFailedOr((state) =>
      Specimens.integer(IntegerRange.constant(0, 9999))
        .map((id) => id.toString())
        .filter((id) => state.todoOrder.includes(id) === false)
        .map<TodoListAction>((id) => ({ type: 'add', text: '', id })),
    ),
    delete: terminateIfFailedOr((state) =>
      state.todoOrder.length === 0
        ? Specimens.InvalidTransition
        : Specimens.item(state.todoOrder).map<TodoListAction>((id) => ({ type: 'delete', id })),
    ),
    toggle: terminateIfFailedOr((state) =>
      state.todoOrder.length === 0
        ? Specimens.InvalidTransition
        : Specimens.item(state.todoOrder).map<TodoListAction>((id) => ({ type: 'toggle', id })),
    ),
    move: terminateIfFailedOr((state) =>
      state.todoOrder.length === 0
        ? Specimens.InvalidTransition
        : Specimens.zip(
            Specimens.item(state.todoOrder),
            Specimens.integer(IntegerRange.constant(0, state.todoOrder.length - 1)),
          ).map<TodoListAction>(([id, toIndex]) => ({ type: 'move', id, toIndex })),
    ),
  });

  test('I can create state machine specimens that avoids a failure state', () => {
    const specimens = generateSpecimens(reducerSpecimens, Seed.spawn(), 100);

    expect(specimens).toHaveLength(100);
    specimens.forEach((specimen) => {
      if (specimen === Exhausted) throw 'Should not exhaust';
      expect(specimen.kind).toEqual('accepted');
      expect(Specimen.getValueUnsafe(specimen)).toMatchObject({ type: 'ok' });
    });
  });
});
