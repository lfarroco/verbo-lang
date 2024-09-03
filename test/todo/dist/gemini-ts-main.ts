type State = {
  todos: Todo[];
};

type Todo = {
  name: string;
  dueTo: string;
  completed: boolean;
};

export function main(
  initialState: State,
  ports: {
    print: (message: string) => void;
  }
): number {
  const state = { ...initialState }; // shallow copy of the initial state
  const todos = [
    { name: "buy bread", dueTo: "01/01/2025", completed: true },
    { name: "buy milk", dueTo: "02/02/2026", completed: false },
    { name: "buy cheese", dueTo: "03/03/2027", completed: false },
    { name: "buy eggs", dueTo: "04/04/2028", completed: false },
    { name: "buy juice", dueTo: "05/05/2029", completed: false },
    { name: "buy water", dueTo: "06/06/2030", completed: false },
  ];

  state.todos = todos;

  function printTodoItem(todo: Todo): void {
    const completedIndicator = todo.completed ? "x" : " ";
    const todoString = `[${completedIndicator}] ${todo.name} - due to ${todo.dueTo}`;
    ports.print(todoString);
  }

  function markTodoItemAsCompleted(todo: Todo): void {
    todo.completed = true;
  }

  function markTodoItemAsIncomplete(todo: Todo): void {
    todo.completed = false;
  }

  function removeTodoItem(todo: Todo): void {
    const index = state.todos.indexOf(todo);
    if (index > -1) {
      state.todos.splice(index, 1);
    }
  }

  state.todos.forEach((todo) => printTodoItem(todo));

  ports.print(`The number of todos is: ${state.todos.length}`);

  ports.print("== the second todo will be updated (completed) ==");
  markTodoItemAsCompleted(state.todos[1]);
  printTodoItem(state.todos[1]);

  ports.print("== the first todo will be updated (incomplete) ==");
  markTodoItemAsIncomplete(state.todos[0]);
  printTodoItem(state.todos[0]);

  removeTodoItem(state.todos[0]);

  ports.print("== the first will be removed ==");

  ports.print(`The number of todos is: ${state.todos.length}`);

  ports.print("====");
  ports.print("Goodbye!");

  return 0;
}