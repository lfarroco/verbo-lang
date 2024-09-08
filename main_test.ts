//import { assertEquals } from "@std/assert";
import { main } from "./main.ts";

Deno.test(async function addTest() {
  await main()
});
