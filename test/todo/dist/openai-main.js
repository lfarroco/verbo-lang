// == example-todos.md ==
const todos = [
    { name: 'buy bread', dueDate: '2025-01-01', completed: true },
    { name: 'buy milk', dueDate: '2026-02-02', completed: false },
    { name: 'finish homework', dueDate: '2023-11-15', completed: false },
    { name: 'clean house', dueDate: '2024-03-22', completed: false },
    { name: 'pay bills', dueDate: '2023-12-01', completed: false },
    { name: 'call mom', dueDate: '2023-10-25', completed: false },
    { name: 'exercise', dueDate: '2023-11-20', completed: false }
];

// == model.md ==
function printTodoItem(todo) {
    const status = todo.completed ? 'x' : ' ';
    console.log(`[${status}] ${todo.name} - due to ${todo.dueDate}`);
}

function markTodoItemAsCompleted(todo) {
    todo.completed = true;
}

function markTodoItemAsIncomplete(todo) {
    todo.completed = false;
}

// == main.md ==
todos.forEach(printTodoItem);

console.log('====');

markTodoItemAsCompleted(todos[1]);
printTodoItem(todos[1]);

console.log('====');

markTodoItemAsIncomplete(todos[0]);
printTodoItem(todos[0]);

console.log('====');

console.log('Goodbye!');