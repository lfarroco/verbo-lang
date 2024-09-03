"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
function main(initialState, ports) {
    var state = __assign({}, initialState); // shallow copy of the initial state
    var todos = [
        { name: "buy bread", dueTo: "01/01/2025", completed: true },
        { name: "buy milk", dueTo: "02/02/2026", completed: false },
        { name: "buy cheese", dueTo: "03/03/2027", completed: false },
        { name: "buy eggs", dueTo: "04/04/2028", completed: false },
        { name: "buy juice", dueTo: "05/05/2029", completed: false },
        { name: "buy water", dueTo: "06/06/2030", completed: false },
    ];
    state.todos = todos;
    function printTodoItem(todo) {
        var completedIndicator = todo.completed ? "x" : " ";
        var todoString = "[".concat(completedIndicator, "] ").concat(todo.name, " - due to ").concat(todo.dueTo);
        ports.print(todoString);
    }
    function markTodoItemAsCompleted(todo) {
        todo.completed = true;
    }
    function markTodoItemAsIncomplete(todo) {
        todo.completed = false;
    }
    function removeTodoItem(todo) {
        var index = state.todos.indexOf(todo);
        if (index > -1) {
            state.todos.splice(index, 1);
        }
    }
    state.todos.forEach(function (todo) { return printTodoItem(todo); });
    ports.print("The number of todos is: ".concat(state.todos.length));
    ports.print("== the second todo will be updated (completed) ==");
    markTodoItemAsCompleted(state.todos[1]);
    printTodoItem(state.todos[1]);
    ports.print("== the first todo will be updated (incomplete) ==");
    markTodoItemAsIncomplete(state.todos[0]);
    printTodoItem(state.todos[0]);
    removeTodoItem(state.todos[0]);
    ports.print("== the first will be removed ==");
    ports.print("The number of todos is: ".concat(state.todos.length));
    ports.print("====");
    ports.print("Goodbye!");
    return 0;
}
