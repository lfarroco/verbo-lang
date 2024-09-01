interface TodoItem {
  name: string;
  dueTo: Date;
  completed: boolean;
}

const todos: TodoItem[] = [
  { name: 'buy bread', dueTo: new Date('2025-01-01'), completed: true },
  { name: 'buy milk', dueTo: new Date('2026-02-02'), completed: false },
  { name: 'buy eggs', dueTo: new Date('2027-03-03'), completed: false },
  { name: 'buy cheese', dueTo: new Date('2028-04-04'), completed: false },
  { name: 'buy yogurt', dueTo: new Date('2029-05-05'), completed: false },
  { name: 'buy water', dueTo: new Date('2030-06-06'), completed: false },
];

function printTodoItem(todo: TodoItem): void {
  const completedSymbol = todo.completed ? '[x]' : '[ ]';
  console.log(`${completedSymbol} ${todo.name} - due to ${todo.dueTo.toISOString().slice(0, 10)}`);
}

function markTodoItemAsCompleted(todo: TodoItem): void {
  todo.completed = true;
}

function markTodoItemAsIncomplete(todo: TodoItem): void {
  todo.completed = false;
}

todos.forEach(printTodoItem);
console.log('====');

markTodoItemAsCompleted(todos[1]);
printTodoItem(todos[1]);
console.log('====');

markTodoItemAsIncomplete(todos[0]);
printTodoItem(todos[0]);
console.log('====');

console.log('Goodbye!');