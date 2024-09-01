data TodoItem = TodoItem {
  name :: String,
  dueDate :: String,
  completed :: Bool
} deriving (Show)

-- example-todos.md
todos = [
  TodoItem { name = "buy bread", dueDate = "01/01/2025", completed = True },
  TodoItem { name = "buy milk", dueDate = "02/02/2026", completed = False },
  TodoItem { name = "buy cheese", dueDate = "03/03/2027", completed = False },
  TodoItem { name = "buy eggs", dueDate = "04/04/2028", completed = False },
  TodoItem { name = "buy flour", dueDate = "05/05/2029", completed = False },
  TodoItem { name = "buy sugar", dueDate = "06/06/2030", completed = False }
]

printTodoItem :: TodoItem -> IO ()
printTodoItem item = putStrLn $
  if completed item then "[x] " else "[ ] " ++
  name item ++ " - due to " ++ dueDate item

markTodoItemAsCompleted :: TodoItem -> TodoItem
markTodoItemAsCompleted item = item { completed = True }

markTodoItemAsIncomplete :: TodoItem -> TodoItem
markTodoItemAsIncomplete item = item { completed = False }

main :: IO ()
main = do
  mapM_ printTodoItem todos
  putStrLn "===="
  let secondItem = todos !! 1
  printTodoItem $ markTodoItemAsCompleted secondItem
  putStrLn "===="
  let firstItem = todos !! 0
  printTodoItem $ markTodoItemAsIncomplete firstItem
  putStrLn "===="
  putStrLn "Goodbye!"