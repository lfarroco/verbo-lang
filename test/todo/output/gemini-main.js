const todos = [
  { name: 'buy bread', dueTo: '01/01/2025', completed: true },
  { name: 'buy milk', dueTo: '02/02/2026', completed: false },
  { name: 'buy eggs', dueTo: '03/03/2027', completed: false },
  { name: 'buy cheese', dueTo: '04/04/2028', completed: false },
  { name: 'buy ham', dueTo: '05/05/2029', completed: false },
  { name: 'buy wine', dueTo: '06/06/2030', completed: false },
];

function printTodoItem(todoItem) {
  const completedSymbol = todoItem.completed ? 'x' : ' ';
  console.log(`[${completedSymbol}] ${todoItem.name} - due to ${todoItem.dueTo}`);
}

function markTodoItemAsCompleted(todoItem) {
  todoItem.completed = true;
}

function markTodoItemAsIncomplete(todoItem) {
  todoItem.completed = false;
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