
import { Router, Context, RouterContext } from "https://deno.land/x/oak/mod.ts";
import { Client } from "https://deno.land/x/postgres/mod.ts";
import {
  Hero,
  Item,
  Location,
  Monster,
  HeroItem,
} from "./models.ts";

import * as dbClients from "./db-client.ts";

export function handleRoutes(client: Client, router: Router) {
  router
    .get("/heroes", async (ctx: Context) => {
      ctx.response.body = await dbClients.getHeroes(client);
    })
    .get("/heroes/:id", async (ctx: RouterContext<"/heroes/:id", { id: string }>) => {
      ctx.response.body = await dbClients.getHero(client, parseInt(ctx.params.id));
    })
    .post("/heroes", async (ctx: Context) => {
      const hero: Omit<Hero, "id" | "createdAt" | "updatedAt"> = await ctx.request.body.json();
      ctx.response.body = await dbClients.createHero(client, hero);
    })
    .put("/heroes/:id", async (ctx: RouterContext<"/heroes/:id", { id: string }>) => {
      const hero: Hero = await ctx.request.body.json();
      ctx.response.body = await dbClients.updateHero(client, hero);
    })
    .delete("/heroes/:id", async (ctx: RouterContext<"/heroes/:id", { id: string }>) => {
      await dbClients.deleteHero(client, parseInt(ctx.params.id));
      ctx.response.status = 204;
    })
    .get("/heroes/:id/items", async (ctx: RouterContext<"/heroes/:id/items", { id: string }>) => {
      ctx.response.body = await dbClients.getItemsByHeroId(client, parseInt(ctx.params.id));
    })
    .post("/heroes/:id/items/:itemId", async (ctx: RouterContext<"/heroes/:id/items/:itemId", { id: string, itemId: string }>) => {
      const heroItem: Omit<HeroItem, "id" | "createdAt" | "updatedAt"> = {
        heroId: parseInt(ctx.params.id),
        itemId: parseInt(ctx.params.itemId),
      };
      ctx.response.body = await dbClients.createHeroItem(client, heroItem);
    })
    .delete("/heroes/:id/items/:itemId", async (ctx: RouterContext<"/heroes/:id/items/:itemId", { id: string, itemId: string }>) => {
      await dbClients.deleteHeroItem(client, parseInt(ctx.params.itemId));
      ctx.response.status = 204;
    })
    .get("/monsters", async (ctx: Context) => {
      ctx.response.body = await dbClients.getMonsters(client);
    })
    .get("/monsters/:id", async (ctx: RouterContext<"/monsters/:id", { id: string }>) => {
      ctx.response.body = await dbClients.getMonster(client, parseInt(ctx.params.id));
    })
    .post("/monsters", async (ctx: Context) => {
      const monster: Omit<Monster, "id" | "createdAt" | "updatedAt"> = await ctx.request.body.json();
      ctx.response.body = await dbClients.createMonster(client, monster);
    })
    .put("/monsters/:id", async (ctx: RouterContext<"/monsters/:id", { id: string }>) => {
      const monster: Monster = await ctx.request.body.json();
      ctx.response.body = await dbClients.updateMonster(client, monster);
    })
    .delete("/monsters/:id", async (ctx: RouterContext<"/monsters/:id", { id: string }>) => {
      await dbClients.deleteMonster(client, parseInt(ctx.params.id));
      ctx.response.status = 204;
    })
    .get("/items", async (ctx: Context) => {
      ctx.response.body = await dbClients.getItems(client);
    })
    .get("/items/:id", async (ctx: RouterContext<"/items/:id", { id: string }>) => {
      ctx.response.body = await dbClients.getItem(client, parseInt(ctx.params.id));
    })
    .post("/items", async (ctx: Context) => {
      const item: Omit<Item, "id" | "createdAt" | "updatedAt"> = await ctx.request.body.json();
      ctx.response.body = await dbClients.createItem(client, item);
    })
    .put("/items/:id", async (ctx: RouterContext<"/items/:id", { id: string }>) => {
      const item: Item = await ctx.request.body.json();
      ctx.response.body = await dbClients.updateItem(client, item);
    })
    .delete("/items/:id", async (ctx: RouterContext<"/items/:id", { id: string }>) => {
      await dbClients.deleteItem(client, parseInt(ctx.params.id));
      ctx.response.status = 204;
    })
    .get("/locations", async (ctx: Context) => {
      ctx.response.body = await dbClients.getLocations(client);
    })
    .get("/locations/:id", async (ctx: RouterContext<"/locations/:id", { id: string }>) => {
      ctx.response.body = await dbClients.getLocation(client, parseInt(ctx.params.id));
    })
    .post("/locations", async (ctx: Context) => {
      const location: Omit<Location, "id" | "createdAt" | "updatedAt"> = await ctx.request.body.json();
      ctx.response.body = await dbClients.createLocation(client, location);
    })
    .put("/locations/:id", async (ctx: RouterContext<"/locations/:id", { id: string }>) => {
      const location: Location = await ctx.request.body.json();
      ctx.response.body = await dbClients.updateLocation(client, location);
    })
    .delete("/locations/:id", async (ctx: RouterContext<"/locations/:id", { id: string }>) => {
      await dbClients.deleteLocation(client, parseInt(ctx.params.id));
      ctx.response.status = 204;
    })
    .get("/locations/:id/monsters", async (ctx: RouterContext<"/locations/:id/monsters", { id: string }>) => {
      ctx.response.body = await dbClients.getMonstersByLocationId(client, parseInt(ctx.params.id));
    });
}

