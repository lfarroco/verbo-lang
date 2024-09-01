
Verbo is a Programming language defined in Markedown that compiles to Python, JavaScript, and other languages.

## Comments

That's the nice thing about verbo - everything is a comment. All the text is at the
same time documentation and code.

## Literals

You can declare variables like this:

You can use direct assignment:

```verbo
name: "John"
age: 25
```
or signal that a variable exists:
```verbo
Use a constant called FILE_PATH to store the path to the configuration file.
```

Later, you can use the variable like this:
```verbo
Log the FILE_PATH variable to the console.
```

## Lists

You can define lists like this:

```verbo
names:
  - John
  - Mary
  - Peter
```

Or use natural language:

```verbo
The list "test foods" contains the following items:
  - apple
  - banana
  - carrot
  ... and other 10 random items
```

This is useful for defining test data.

## Objects

You can define objects like this:

```verbo
person:
  name: "John"
  age: 25
```

Or use natural language:

```
A "Person" object has the following properties:
  - name, a string
  - age, an integer
```

You can get creative with the properties:

```
A "Person" object has the following properties:
  - name, a string up to 10 characters
  - age, an integer, higher than 0
  - birthdate, a date (format: YYYY-MM-DD)
  - "is student", a boolean
```

## Methods

You can attach methods to objects like this:

```
A "Person" object has the "yell" method. This method returns the person's name in uppercase.
```

Or use it to mutate the object:

```
A "Person" object has the "grow" method. This method increases the person's age by 1.
```

## Functions

You can define functions like this:

```
Define a function called "sum". It receives two parameters, "a" and "b". It returns the sum of "a" and "b".
```

## Conditions

You can define conditions like this:

```
If the variable "age" is higher than 18, return "adult". Otherwise, return "minor".
```


