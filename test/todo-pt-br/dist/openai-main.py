# Defining constants and functions as per exemplos.md and modelo.md

# Constants
todos = [
    {"name": "buy bread", "due_to": "01/01/2025", "completed": True},
    {"name": "buy milk", "due_to": "02/02/2026", "completed": False},
    {"name": "clean house", "due_to": "03/03/2027", "completed": False},
    {"name": "write report", "due_to": "04/04/2028", "completed": False},
    {"name": "read book", "due_to": "05/05/2029", "completed": False},
    {"name": "exercise", "due_to": "06/06/2030", "completed": False},
    {"name": "visit friend", "due_to": "07/07/2031", "completed": False},
]

# Functions


def imprimir_item_a_fazer(item):
    status = "x" if item["completed"] else " "
    print(f"[{status}] {item['name']} - devido a {item['due_to']}")


def marcar_item_a_fazer_como_completo(item):
    item["completed"] = True


def marcar_item_a_fazer_como_incompleto(item):
    item["completed"] = False


# Main execution as per main.md
for item in todos:
    imprimir_item_a_fazer(item)

print("====")

marcar_item_a_fazer_como_completo(todos[1])
imprimir_item_a_fazer(todos[1])

print("====")

marcar_item_a_fazer_como_incompleto(todos[0])
imprimir_item_a_fazer(todos[0])

print("====")

print("Adeus!")
