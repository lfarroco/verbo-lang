
-- Table for monsters
CREATE TABLE monsters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 100),
  health INTEGER NOT NULL,
  attack INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for locations
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for heroes
CREATE TABLE heroes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 100),
  class VARCHAR(255) NOT NULL,
  experience INTEGER NOT NULL,
  health INTEGER NOT NULL,
  attack INTEGER NOT NULL,
  location_id INTEGER REFERENCES locations(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for items
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  value INTEGER NOT NULL CHECK (value > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- A location can have multiple monsters, so we create a join table
CREATE TABLE location_monsters (
  id SERIAL PRIMARY KEY,
  location_id INTEGER REFERENCES locations(id),
  monster_id INTEGER REFERENCES monsters(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- A hero can have multiple items, so we create a join table
CREATE TABLE hero_items (
  id SERIAL PRIMARY KEY,
  hero_id INTEGER REFERENCES heroes(id),
  item_id INTEGER REFERENCES items(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- A monster can drop multiple items, so we create a join table
CREATE TABLE monster_items (
  id SERIAL PRIMARY KEY,
  monster_id INTEGER REFERENCES monsters(id),
  item_id INTEGER REFERENCES items(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
