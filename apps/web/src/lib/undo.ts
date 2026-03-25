interface HistoryState<T> {
  past: T[];
  present: T | null;
  future: T[];
}

export function createHistory<T>(initialState: T) {
  const history: HistoryState<T> = {
    past: [],
    present: initialState,
    future: [],
  };

  return {
    getState: () => history.present,
    canUndo: () => history.past.length > 0,
    canRedo: () => history.future.length > 0,

    push: (newState: T) => {
      // Keep present in past
      history.past = [...history.past, history.present!];
      history.present = newState;
      // Clear future on new action
      history.future = [];
    },

    undo: (): T | null => {
      if (history.past.length === 0) return null;

      // Move present to future
      history.future = [history.present!, ...history.future];
      // Get new present from past
      const newPresent = history.past[history.past.length - 1];
      history.past = history.past.slice(0, -1);
      history.present = newPresent;

      return newPresent;
    },

    redo: (): T | null => {
      if (history.future.length === 0) return null;

      // Move present to past
      history.past = [...history.past, history.present!];
      // Get new present from future
      const newPresent = history.future[0];
      history.future = history.future.slice(1);
      history.present = newPresent;

      return newPresent;
    },

    reset: (newState: T) => {
      history.past = [];
      history.present = newState;
      history.future = [];
    },
  };
}
