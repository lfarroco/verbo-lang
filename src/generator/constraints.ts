import type { Property } from "../extract/types.ts";

/**
 * Whether an `enum` constraint applies to a property — i.e. the property is a
 * scalar `string` or `number`.
 *
 * Single source of truth shared by both generators (docs/tasks.md H1): the
 * type generator refuses to swap the property's type for an enum union on
 * non-scalars (a union would swallow the `[]` of `string[]` or a model
 * reference), and the assertion generator skips enum checks on non-scalars
 * (they could not be type-checked). Array enums ("every element is one of …")
 * are intentionally not supported — use scalar enum constraints only.
 */
export function enumApplies(property: Property): boolean {
  return property.type === "string" || property.type === "number";
}
