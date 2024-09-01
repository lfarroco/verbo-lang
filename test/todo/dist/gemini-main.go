package main

import (
	"fmt"
	"time"
)

type TodoItem struct {
	Name      string
	DueDate   time.Time
	Completed bool
}

func printTodoItem(item TodoItem) {
	if item.Completed {
		fmt.Printf("[x] %s - due to %s\n", item.Name, item.DueDate.Format("2006-01-02"))
	} else {
		fmt.Printf("[ ] %s - due to %s\n", item.Name, item.DueDate.Format("2006-01-02"))
	}
}

func markTodoItemAsCompleted(item *TodoItem) {
	item.Completed = true
}

func markTodoItemAsIncomplete(item *TodoItem) {
	item.Completed = false
}

func main() {
	todos := []TodoItem{
		{Name: "buy bread", DueDate: time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC), Completed: true},
		{Name: "buy milk", DueDate: time.Date(2026, 2, 2, 0, 0, 0, 0, time.UTC), Completed: false},
		{Name: "buy eggs", DueDate: time.Date(2027, 3, 3, 0, 0, 0, 0, time.UTC), Completed: false},
		{Name: "buy cheese", DueDate: time.Date(2028, 4, 4, 0, 0, 0, 0, time.UTC), Completed: false},
		{Name: "buy yogurt", DueDate: time.Date(2029, 5, 5, 0, 0, 0, 0, time.UTC), Completed: false},
		{Name: "buy juice", DueDate: time.Date(2030, 6, 6, 0, 0, 0, 0, time.UTC), Completed: false},
	}

	for _, item := range todos {
		printTodoItem(item)
	}

	fmt.Println("====")

	markTodoItemAsCompleted(&todos[1])
	printTodoItem(todos[1])

	fmt.Println("====")

	markTodoItemAsIncomplete(&todos[0])
	printTodoItem(todos[0])

	fmt.Println("====")

	fmt.Println("Goodbye!")
}
