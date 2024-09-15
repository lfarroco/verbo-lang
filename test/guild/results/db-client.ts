
import { Client } from "https://deno.land/x/postgres/mod.ts";
import {
  Hero,
  Item,
  Location,
  Monster,
  HeroItem,
  LocationMonster,
  MonsterItem,
} from "./models.ts";

// Monster Client

export async function getMonster(
  client: Client,
  id: number,
): Promise<Monster> {
  const result = await client.queryObject<Monster>`
    SELECT * FROM monsters WHERE id = ${id};
  `;
  return result.rows[0];
}

export async function getMonsters(
  client: Client,
): Promise<Monster[]> {
  const result = await client.queryObject<Monster>`
    SELECT * FROM monsters;
  `;
  return result.rows;
}

export async function createMonster(
  client: Client,
  monster: Omit<Monster, "id" | "createdAt" | "updatedAt">,
): Promise<Monster> {
  const result = await client.queryObject<Monster>`
    INSERT INTO monsters (name, level, health, attack) VALUES (${monster.name}, ${monster.level}, ${monster.health}, ${monster.attack}) RETURNING *;
  `;
  return result.rows[0];
}

export async function updateMonster(
  client: Client,
  monster: Monster,
): Promise<Monster> {
  const result = await client.queryObject<Monster>`
    UPDATE monsters SET name = ${monster.name}, level = ${monster.level}, health = ${monster.health}, attack = ${monster.attack} WHERE id = ${monster.id} RETURNING *;
  `;
  return result.rows[0];
}

export async function deleteMonster(
  client: Client,
  id: number,
): Promise<void> {
  await client.queryObject<void>`DELETE FROM monsters WHERE id = ${id};`;
}

// Location Client

export async function getLocation(
  client: Client,
  id: number,
): Promise<Location> {
  const result = await client.queryObject<Location>`
    SELECT * FROM locations WHERE id = ${id};
  `;
  return result.rows[0];
}

export async function getLocations(
  client: Client,
): Promise<Location[]> {
  const result = await client.queryObject<Location>`
    SELECT * FROM locations;
  `;
  return result.rows;
}

export async function createLocation(
  client: Client,
  location: Omit<Location, "id" | "createdAt" | "updatedAt">,
): Promise<Location> {
  const result = await client.queryObject<Location>`
    INSERT INTO locations (name, description) VALUES (${location.name}, ${location.description
    }) RETURNING *;
  `;
  return result.rows[0];
}

export async function updateLocation(
  client: Client,
  location: Location,
): Promise<Location> {
  const result = await client.queryObject<Location>`
    UPDATE locations SET name = ${location.name}, description = ${location.description
    } WHERE id = ${location.id} RETURNING *;
  `;
  return result.rows[0];
}

export async function deleteLocation(
  client: Client,
  id: number,
): Promise<void> {
  await client.queryObject<void>`DELETE FROM locations WHERE id = ${id};`;
}

// Hero Client

export async function getHero(
  client: Client,
  id: number,
): Promise<Hero> {
  const result = await client.queryObject<Hero>`
    SELECT * FROM heroes WHERE id = ${id};
  `;
  return result.rows[0];
}

export async function getHeroes(
  client: Client,
): Promise<Hero[]> {
  const result = await client.queryObject<Hero>`
    SELECT * FROM heroes;
  `;
  return result.rows;
}

export async function createHero(
  client: Client,
  hero: Omit<Hero, "id" | "createdAt" | "updatedAt">,
): Promise<Hero> {
  const result = await client.queryObject<Hero>`
    INSERT INTO heroes (name, level, class, experience, health, attack, location_id) VALUES (${hero.name}, ${hero.level}, ${hero.class}, ${hero.experience}, ${hero.health}, ${hero.attack}, ${hero.locationId}) RETURNING *;
  `;
  return result.rows[0];
}

export async function updateHero(
  client: Client,
  hero: Hero,
): Promise<Hero> {
  const result = await client.queryObject<Hero>`
    UPDATE heroes SET name = ${hero.name}, level = ${hero.level}, class = ${hero.class
    }, experience = ${hero.experience}, health = ${hero.health}, attack = ${hero.attack
    }, location_id = ${hero.locationId} WHERE id = ${hero.id} RETURNING *;
  `;
  return result.rows[0];
}

export async function deleteHero(
  client: Client,
  id: number,
): Promise<void> {
  await client.queryObject<void>`DELETE FROM heroes WHERE id = ${id};`;
}

// Item Client

export async function getItem(
  client: Client,
  id: number,
): Promise<Item> {
  const result = await client.queryObject<Item>`
    SELECT * FROM items WHERE id = ${id};
  `;
  return result.rows[0];
}

export async function getItems(
  client: Client,
): Promise<Item[]> {
  const result = await client.queryObject<Item>`
    SELECT * FROM items;
  `;
  return result.rows;
}

export async function createItem(
  client: Client,
  item: Omit<Item, "id" | "createdAt" | "updatedAt">,
): Promise<Item> {
  const result = await client.queryObject<Item>`
    INSERT INTO items (name, value) VALUES (${item.name}, ${item.value}) RETURNING *;
  `;
  return result.rows[0];
}

export async function updateItem(
  client: Client,
  item: Item,
): Promise<Item> {
  const result = await client.queryObject<Item>`
    UPDATE items SET name = ${item.name}, value = ${item.value} WHERE id = ${item.id
    } RETURNING *;
  `;
  return result.rows[0];
}

export async function deleteItem(
  client: Client,
  id: number,
): Promise<void> {
  await client.queryObject<void>`DELETE FROM items WHERE id = ${id};`;
}

// LocationMonster Client

export async function getLocationMonster(
  client: Client,
  id: number,
): Promise<LocationMonster> {
  const result = await client.queryObject<LocationMonster>`
    SELECT * FROM location_monsters WHERE id = ${id};
  `;
  return result.rows[0];
}

export async function getLocationMonsters(
  client: Client,
): Promise<LocationMonster[]> {
  const result = await client.queryObject<LocationMonster>`
    SELECT * FROM location_monsters;
  `;
  return result.rows;
}

export async function createLocationMonster(
  client: Client,
  locationMonster: Omit<
    LocationMonster,
    "id" | "createdAt" | "updatedAt"
  >,
): Promise<LocationMonster> {
  const result = await client.queryObject<LocationMonster>`
    INSERT INTO location_monsters (location_id, monster_id) VALUES (${locationMonster.locationId
    }, ${locationMonster.monsterId}) RETURNING *;
  `;
  return result.rows[0];
}

export async function updateLocationMonster(
  client: Client,
  locationMonster: LocationMonster,
): Promise<LocationMonster> {
  const result = await client.queryObject<LocationMonster>`
    UPDATE location_monsters SET location_id = ${locationMonster.locationId
    }, monster_id = ${locationMonster.monsterId} WHERE id = ${locationMonster.id
    } RETURNING *;
  `;
  return result.rows[0];
}

export async function deleteLocationMonster(
  client: Client,
  id: number,
): Promise<void> {
  await client.queryObject<void>`DELETE FROM location_monsters WHERE id = ${id};`;
}

// HeroItem Client

export async function getHeroItem(
  client: Client,
  id: number,
): Promise<HeroItem> {
  const result = await client.queryObject<HeroItem>`
    SELECT * FROM hero_items WHERE id = ${id};
  `;
  return result.rows[0];
}

export async function getHeroItems(
  client: Client,
): Promise<HeroItem[]> {
  const result = await client.queryObject<HeroItem>`
    SELECT * FROM hero_items;
  `;
  return result.rows;
}

export async function createHeroItem(
  client: Client,
  heroItem: Omit<HeroItem, "id" | "createdAt" | "updatedAt">,
): Promise<HeroItem> {
  const result = await client.queryObject<HeroItem>`
    INSERT INTO hero_items (hero_id, item_id) VALUES (${heroItem.heroId}, ${heroItem.itemId
    }) RETURNING *;
  `;
  return result.rows[0];
}

export async function updateHeroItem(
  client: Client,
  heroItem: HeroItem,
): Promise<HeroItem> {
  const result = await client.queryObject<HeroItem>`
    UPDATE hero_items SET hero_id = ${heroItem.heroId}, item_id = ${heroItem.itemId
    } WHERE id = ${heroItem.id} RETURNING *;
  `;
  return result.rows[0];
}

export async function deleteHeroItem(
  client: Client,
  id: number,
): Promise<void> {
  await client.queryObject<void>`DELETE FROM hero_items WHERE id = ${id};`;
}

// MonsterItem Client

export async function getMonsterItem(
  client: Client,
  id: number,
): Promise<MonsterItem> {
  const result = await client.queryObject<MonsterItem>`
    SELECT * FROM monster_items WHERE id = ${id};
  `;
  return result.rows[0];
}

export async function getMonsterItems(
  client: Client,
): Promise<MonsterItem[]> {
  const result = await client.queryObject<MonsterItem>`
    SELECT * FROM monster_items;
  `;
  return result.rows;
}

export async function createMonsterItem(
  client: Client,
  monsterItem: Omit<MonsterItem, "id" | "createdAt" | "updatedAt">,
): Promise<MonsterItem> {
  const result = await client.queryObject<MonsterItem>`
    INSERT INTO monster_items (monster_id, item_id) VALUES (${monsterItem.monsterId
    }, ${monsterItem.itemId}) RETURNING *;
  `;
  return result.rows[0];
}

export async function updateMonsterItem(
  client: Client,
  monsterItem: MonsterItem,
): Promise<MonsterItem> {
  const result = await client.queryObject<MonsterItem>`
    UPDATE monster_items SET monster_id = ${monsterItem.monsterId}, item_id = ${monsterItem.itemId
    } WHERE id = ${monsterItem.id} RETURNING *;
  `;
  return result.rows[0];
}

export async function deleteMonsterItem(
  client: Client,
  id: number,
): Promise<void> {
  await client.queryObject<void>`DELETE FROM monster_items WHERE id = ${id};`;
}

// Relationships

export async function getMonstersByLocationId(
  client: Client,
  locationId: number,
): Promise<Monster[]> {
  const result = await client.queryObject<Monster>`
    SELECT m.* FROM monsters m
    JOIN location_monsters lm ON m.id = lm.monster_id
    WHERE lm.location_id = ${locationId};
  `;
  return result.rows;
}

export async function getItemsByHeroId(
  client: Client,
  heroId: number,
): Promise<Item[]> {
  const result = await client.queryObject<Item>`
    SELECT i.* FROM items i
    JOIN hero_items hi ON i.id = hi.item_id
    WHERE hi.hero_id = ${heroId};
  `;
  return result.rows;
}

export async function getItemsByMonsterId(
  client: Client,
  monsterId: number,
): Promise<Item[]> {
  const result = await client.queryObject<Item>`
    SELECT i.* FROM items i
    JOIN monster_items mi ON i.id = mi.item_id
    WHERE mi.monster_id = ${monsterId};
  `;
  return result.rows;
}
