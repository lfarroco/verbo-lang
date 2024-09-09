The endpoints are:

- `/heroes`
- `/heroes/{id}`
- `/monsters`
- `/monsters/{id}`
- `/items`
- `/items/{id}`
- `/locations`
- `/locations/{id}`

The following endpoints allow interacting with the relationships:

- `/heroes/{id}/items` - Get all items for a hero.
- `/heroes/{id}/items/{itemId}` - Add an item to a hero.
- `/heroes/{id}/items/{itemId}` - Remove an item from a hero.
- `/locations/{id}/monsters` - Get all monsters for a location.
