const todos = [
  { name: 'buy bread', dueTo: '01/01/2025', completed: true },
  { name: 'buy milk', dueTo: '02/02/2026', completed: false },
  { name: 'buy eggs', dueTo: '03/03/2027', completed: false },
  { name: 'buy cheese', dueTo: '04/04/2028', completed: false },
  { name: 'buy yogurt', dueTo: '05/05/2029', completed: false },
  { name: 'buy fruit', dueTo: '06/06/2030', completed: false },
];

function printTodoItem(todoItem) {
  const completionMark = todoItem.completed ? '[x]' : '[ ]';
  console.log(`${completionMark} ${todoItem.name} - due to ${todoItem.dueTo}`);
}

todos.forEach(printTodoItem);