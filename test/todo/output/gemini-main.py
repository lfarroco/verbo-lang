class ToDoItem:
    def __init__(self, name, due_to, completed):
        self.name = name
        self.due_to = due_to
        self.completed = completed

    def print_todo_item(self):
        completed_mark = "[x]" if self.completed else "[ ]"
        print(f"{completed_mark} {self.name} - due to {self.due_to}")

    def mark_todo_item_as_completed(self):
        self.completed = True

    def mark_todo_item_as_incomplete(self):
        self.completed = False

todos = [
    ToDoItem("buy bread", "01/01/2025", True),
    ToDoItem("buy milk", "02/02/2026", False),
    ToDoItem("buy eggs", "03/03/2027", False),
    ToDoItem("buy cheese", "04/04/2028", False),
    ToDoItem("buy yogurt", "05/05/2029", False),
    ToDoItem("buy coffee", "06/06/2030", False),
]

for todo in todos:
    todo.print_todo_item()

print("====")

todos[1].mark_todo_item_as_completed()
todos[1].print_todo_item()

print("====")

todos[0].mark_todo_item_as_incomplete()
todos[0].print_todo_item()

print("====")

print("Goodbye!")