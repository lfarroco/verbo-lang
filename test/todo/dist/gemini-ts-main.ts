type State = {
  todos: Todo[];
};

export type Todo = {
  name: string;
  dueDate: string;
  completed: boolean;
};

export function main(
  initialState: State,
  ports: {
    print: (message: string) => void;
  }
): number {
  const state = { ...initialState }; // shallow copy of the initial state

  // Constants
  const todos = [
    { name: "buy bread", dueDate: "01/01/2025", completed: true },
    { name: "buy milk", dueDate: "02/02/2026", completed: false },
    { name: "buy eggs", dueDate: "03/03/2027", completed: false },
    { name: "buy cheese", dueDate: "04/04/2028", completed: false },
    { name: "buy yogurt", dueDate: "05/05/2029", completed: false },
    { name: "buy butter", dueDate: "06/06/2030", completed: false },
    { name: "buy jam", dueDate: "07/07/2031", completed: false },
  ];

  // Functions
  function printTodoItem(todo: Todo): void {
    const completedSymbol = todo.completed ? "x" : " ";
    ports.print(
      `[${completedSymbol}] ${todo.name} - due to ${todo.dueDate}`
    );
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

  // Logic

  state.todos.forEach((todo) => {
    printTodoItem(todo);
  });

  ports.print(`The number of todos is: ${state.todos.length}`);

  ports.print("== the second todo will be updated (completed) ==");
  markTodoItemAsCompleted(state.todos[1]);
  printTodoItem(state.todos[1]);

  ports.print("== the first todo will be updated (incomplete)==");
  markTodoItemAsIncomplete(state.todos[0]);
  printTodoItem(state.todos[0]);

  removeTodoItem(state.todos[0]);
  ports.print("== the first will be removed ==");
  ports.print(`The number of todos is: ${state.todos.length}`);

  ports.print("====");
  ports.print("Goodbye!");

  return 0;
}