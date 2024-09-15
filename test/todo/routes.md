These GET endpoints are used to query for todos:

- `/todos`: Get all todos.
- `/todos/{id}`: Get a todo by id.
- `/todos?status=active`: Get all active todos.
- `/todos?status=completed`: Get all completed todos.

To create a new todo:

- POST `/todos`: Create a new todo. The payload should be a JSON object with the
  following properties:
  - name: string

To update a todo:

- PUT `/todos/{id}`: Update a todo. The payload should be a JSON object with the
  following properties:
  - name: string
  - status: string (restricted to the options described in the todo model)

To delete a todo:

- DELETE `/todos/{id}`: Delete a todo by id. No payload is required.
