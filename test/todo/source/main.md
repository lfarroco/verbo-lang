
This application will be a long-running process that manages a list of todos.

The application state is composed of:
- A list of todos received as an argument

The application ports are:
- A function called "ring bell" that receives a string

The application exposes the following operations to allow manipulating the state:
- get todos: returns all todos
- add todo: receives a todo name and a due date and adds it to the list
- remove todo: receives a todo name and removes it from the list
- update due date: receives a todo name and a new due date and updates the todo
- mark as completed: receives a todo name and marks it as completed.
- mask as incomplete: receives a todo name and marks it as incomplete

When "markAsCompleted" is called, the application should call the "ring bell" port with the todo item name as a parameter.