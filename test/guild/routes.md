The endpoints for the application are:

- `/heroes` - Returns a list of all heroes.
- `/heroes/{id}` - Returns a specific hero.
- `/monsters` - Returns a list of all monsters.
- `/monsters/{id}` - Returns a specific monster.
- `/items` - Returns a list of all items.
- `/items/{id}` - Returns a specific item.
- `/locations` - Returns a list of all locations.
- `/locations/{id}` - Returns a specific location.

All of the endpoints are GET requests. The data is returned in JSON format.

To create new records, the following endpoints are used:

- `/create-hero` - Creates a new hero.
- `/create-monster` - Creates a new monster.
- `/create-item` - Creates a new item.
- `/create-location` - Creates a new location.

These endpoints are POST requests. The data is sent in JSON format.

To update records, the following endpoints are used:

- `/update-hero/{id}` - Updates a hero.
- `/update-monster/{id}` - Updates a monster.
- `/update-item/{id}` - Updates an item.
- `/update-location/{id}` - Updates a location.

These endpoints are PUT requests. The data is sent in JSON format.
