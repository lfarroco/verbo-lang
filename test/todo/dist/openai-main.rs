#[derive(Debug)]
struct TodoItem {
    name: String,
    due_date: String,
    completed: bool,
}

impl TodoItem {
    fn print_item(&self) {
        let status = if self.completed { "x" } else { " " };
        println!("[{}] {} - due to {}", status, self.name, self.due_date);
    }

    fn mark_as_completed(&mut self) {
        self.completed = true;
    }

    fn mark_as_incomplete(&mut self) {
        self.completed = false;
    }
}

fn main() {
    // List of TODO items as described in example-todos.md
    let mut todos = vec![
        TodoItem { name: String::from("buy bread"), due_date: String::from("2025-01-01"), completed: true },
        TodoItem { name: String::from("buy milk"), due_date: String::from("2026-02-02"), completed: false },
        // Other 5 example items follow the same pattern
        TodoItem { name: String::from("todo 3"), due_date: String::from("2023-03-03"), completed: false },
        TodoItem { name: String::from("todo 4"), due_date: String::from("2024-04-04"), completed: false },
        TodoItem { name: String::from("todo 5"), due_date: String::from("2025-05-05"), completed: false },
        TodoItem { name: String::from("todo 6"), due_date: String::from("2026-06-06"), completed: false },
        TodoItem { name: String::from("todo 7"), due_date: String::from("2027-07-07"), completed: false },
    ];

    // Print all TODO items
    for todo in &todos {
        todo.print_item();
    }

    println!("====");

    // Mark the second item as completed and print
    todos[1].mark_as_completed();
    todos[1].print_item();

    println!("====");

    // Mark the first item as incomplete and print
    todos[0].mark_as_incomplete();
    todos[0].print_item();

    println!("====");

    println!("Goodbye!");
}