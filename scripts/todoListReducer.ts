import * as S from '../src';

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

const terminateIfFailedOr = (continueWith: (s: TodoListOkState) => S.TryTransitionReducer<TodoListAction>) => (
  state: TodoListState,
): S.TryTransitionReducer<TodoListAction> => (state.type === 'fail' ? S.ReducerMustTerminate : continueWith(state));

export const reducerSpecimens = S.fromReducer(INITIAL_STATE, todoListReducer, {
  add: terminateIfFailedOr((state) => ({
    weight: 5,
    specimens: S.integer(S.Range.constant(0, 9999))
      .map((id) => id.toString())
      .filter((id) => state.todoOrder.includes(id) === false)
      .map<TodoListAction>((id) => ({ type: 'add', text: '', id })),
  })),
  delete: terminateIfFailedOr((state) =>
    state.todoOrder.length === 0
      ? S.ActionNotApplicable
      : {
          weight: 1,
          specimens: S.pickElement(state.todoOrder).map<TodoListAction>((id) => ({ type: 'delete', id })),
        },
  ),
  toggle: terminateIfFailedOr((state) =>
    state.todoOrder.length === 0
      ? S.ActionNotApplicable
      : {
          weight: 1,
          specimens: S.pickElement(state.todoOrder).map<TodoListAction>((id) => ({ type: 'toggle', id })),
        },
  ),
  move: terminateIfFailedOr((state) =>
    state.todoOrder.length === 0
      ? S.ActionNotApplicable
      : {
          weight: 1,
          specimens: S.zip(
            S.pickElement(state.todoOrder),
            S.integer(S.Range.constant(0, state.todoOrder.length - 1)),
          ).map<TodoListAction>(([id, toIndex]) => ({ type: 'move', id, toIndex })),
        },
  ),
});
