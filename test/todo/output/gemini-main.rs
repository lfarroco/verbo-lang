use chrono::NaiveDate;

#[derive(Debug)]
struct TodoItem {
    name: String,
    due_to: NaiveDate,
    completed: bool,
}

fn print_todo_item(todo_item: &TodoItem) {
    let completed_marker = if todo_item.completed { "[x]" } else { "[ ]" };
    println!(
        "{} {} - due to {}",
        completed_marker,
        todo_item.name,
        todo_item.due_to.format("%Y-%m-%d")
    );
}

fn mark_todo_item_as_completed(todo_item: &mut TodoItem) {
    todo_item.completed = true;
}

fn mark_todo_item_as_incomplete(todo_item: &mut TodoItem) {
    todo_item.completed = false;
}

fn main() {
    let todos = vec![
        TodoItem {
            name: "buy bread".to_string(),
            due_to: NaiveDate::from_ymd(2025, 1, 1),
            completed: true,
        },
        TodoItem {
            name: "buy milk".to_string(),
            due_to: NaiveDate::from_ymd(2026, 2, 2),
            completed: false,
        },
        TodoItem {
            name: "buy cheese".to_string(),
            due_to: NaiveDate::from_ymd(2027, 3, 3),
            completed: false,
        },
        TodoItem {
            name: "buy eggs".to_string(),
            due_to: NaiveDate::from_ymd(2028, 4, 4),
            completed: false,
        },
        TodoItem {
            name: "buy butter".to_string(),
            due_to: NaiveDate::from_ymd(2029, 5, 5),
            completed: false,
        },
        TodoItem {
            name: "buy yogurt".to_string(),
            due_to: NaiveDate::from_ymd(2030, 6, 6),
            completed: false,
        },
    ];

    for todo_item in &todos {
        print_todo_item(todo_item);
    }

    println!("====");

    let mut second_item = todos[1].clone();
    mark_todo_item_as_completed(&mut second_item);
    print_todo_item(&second_item);

    println!("====");

    let mut first_item = todos[0].clone();
    mark_todo_item_as_incomplete(&mut first_item);
    print_todo_item(&first_item);

    println!("====");

    println!("Goodbye!");
}
