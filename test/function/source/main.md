
This function lets a character in an RPG choose a target to attack.

It receives the following arguments:
- The active character
- A list of enemy characters

It returns the target character to attack (or `null` if there is no available target).

Each character has the following properties:
- `name`: A string
- `position`: An object with `x` and `y` properties
- `health`: A number
- `range`: A number

Choosing a target involves the following steps:
- First, filter all enemies within range
- Then, sort the enemies by health (ascending)
- The target is the first enemy in the sorted list
- It is possible to have no target if there are no enemies in range or if all enemies are behind walls
