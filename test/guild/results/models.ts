
export type Monster = {
  id: number;
  name: string;
  level: number;
  health: number;
  attack: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Location = {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Hero = {
  id: number;
  name: string;
  level: number;
  class: string;
  experience: number;
  health: number;
  attack: number;
  locationId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Item = {
  id: number;
  name: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
};

export type LocationMonster = {
  id: number;
  locationId: number;
  monsterId: number;
  createdAt: Date;
  updatedAt: Date;
};

export type HeroItem = {
  id: number;
  heroId: number;
  itemId: number;
  createdAt: Date;
  updatedAt: Date;
};

export type MonsterItem = {
  id: number;
  monsterId: number;
  itemId: number;
  createdAt: Date;
  updatedAt: Date;
};
