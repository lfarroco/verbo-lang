type Todo = {
  name: string;
  dueDate: string;
  completed: boolean;
};

function printTodoItem(todo: Todo): void {
  const status = todo.completed ? '[x]' : '[ ]';
  console.log(`${status} ${todo.name} - due to ${todo.dueDate}`);
}

function markTodoAsCompleted(todo: Todo): void {
  todo.completed = true;
}

function markTodoAsIncomplete(todo: Todo): void {
  todo.completed = false;
}

function removeTodo(todos: Todo[], todo: Todo): void {
  const index = todos.indexOf(todo);
  todos.splice(index, 1);
}

export function main(): void {
  const todos = [
    { name: 'buy bread', dueDate: '01/01/2025', completed: false },
    { name: 'buy milk', dueDate: '02/02/2026', completed: false },
    // ... other 5 example items
  ];

  for (const todo of todos) {
    printTodoItem(todo);
  }

  console.log(`The number of todos is: ${todos.length}`);

  console.log('== the second todo will be updated (completed) ==');
  markTodoAsCompleted(todos[1]);
  printTodoItem(todos[1]);

  console.log('== the first todo will be updated (incomplete) ==');
  markTodoAsIncomplete(todos[0]);
  printTodoItem(todos[0]);

  removeTodo(todos, todos[0]);

  console.log('== the first will be removed ==');
  console.log(`The number of todos is: ${todos.length}`);

  console.log('====');
  console.log('Goodbye!');
}

main();