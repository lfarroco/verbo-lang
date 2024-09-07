
This defines the "ToDoList" interface component.

This component receives a list of to-do items and renders the following elements:
- A text input field
- A list of to-do items
  - Each item in the list displays:
    - A checkbox (checked if the to-do is completed)
    - The to-do name
    - A button with a "trash" icon

The component uses the following ports:
- print

When the user types in the text input field and presses the enter key, a new to-do item is added to the list.

When the user clicks the "trash" button next to a to-do item, that item is removed from the list.

When the user  clicks an item name, we call the "print" port (providing the item name as an argument).
