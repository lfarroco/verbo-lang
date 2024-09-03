# Contents from example-todos.md
todos = [
    {"name": "buy bread", "due_date": "2025-01-01", "completed": True},
    {"name": "buy milk", "due_date": "2026-02-02", "completed": False},
    {"name": "clean house", "due_date": "2025-05-05", "completed": False},
    {"name": "do laundry", "due_date": "2025-04-04", "completed": False},
    {"name": "finish project", "due_date": "2025-03-03", "completed": False},
    {"name": "call mom", "due_date": "2025-06-06", "completed": False},
    {"name": "plan trip", "due_date": "2025-07-07", "completed": False}
]

# Contents from model.md


def print_todo_item(todo):
    status = "x" if todo["completed"] else " "
    print(f"[{status}] {todo['name']} - due to {todo['due_date']}")


def mark_todo_item_as_completed(todo):
    todo["completed"] = True


def mark_todo_item_as_incomplete(todo):
    todo["completed"] = False

# Contents from main.md


def main():
    for todo in todos:
        print_todo_item(todo)

    print("====")

    mark_todo_item_as_completed(todos[1])
    print_todo_item(todos[1])

    print("====")

    mark_todo_item_as_incomplete(todos[0])
    print_todo_item(todos[0])

    print("====")
    print("Goodbye!")


# Execute main function
if __name__ == "__main__":
    main()
