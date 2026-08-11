import { assertEquals, assertThrows } from "@std/assert";

import { parseExtraction } from "./extractor.ts";

Deno.test("parseExtraction parses a fenced JSON envelope", () => {
  const text = `Here is the result:

\`\`\`json
{"models": [{"name": "Todo", "source": "models/todo.md", "properties": [{"name": "status", "type": "string", "constraints": [{"kind": "enum", "values": ["active", "completed"]}]}]}]}
\`\`\`
`;

  const spec = parseExtraction(text);
  assertEquals(spec.models.length, 1);
  assertEquals(spec.models[0].name, "Todo");
  assertEquals(spec.models[0].source, "models/todo.md");
  assertEquals(spec.models[0].properties[0].name, "status");
  assertEquals(spec.models[0].properties[0].type, "string");
  assertEquals(spec.models[0].properties[0].optional, false);
  assertEquals(spec.models[0].properties[0].constraints, [
    { kind: "enum", values: ["active", "completed"] },
  ]);
  assertEquals(spec.models[0].relationships, []);
});

Deno.test("parseExtraction tolerates a bare array envelope", () => {
  const spec = parseExtraction(`[{"name": "Student", "properties": []}]`);
  assertEquals(spec.models.length, 1);
  assertEquals(spec.models[0].name, "Student");
});

Deno.test("parseExtraction drops malformed entries and defaults missing fields", () => {
  const text = JSON.stringify({
    models: [
      { name: "Good", properties: [{ name: "a", type: "number" }] },
      { name: "", properties: [] }, // missing name → dropped
      { properties: [{ type: "number" }] }, // missing name → dropped
      { name: "Defaults", properties: [{ name: "ok" }] }, // no type → "string"
      "junk", // not an object → dropped
      null,
    ],
  });

  const spec = parseExtraction(text);
  assertEquals(spec.models.map((m) => m.name), ["Good", "Defaults"]);
  assertEquals(spec.models[0].relationships, []);
  assertEquals(spec.models[1].properties[0].type, "string");
  assertEquals(spec.models[1].properties[0].constraints, []);
});

Deno.test("parseExtraction normalizes optional/required precedence", () => {
  const text = JSON.stringify({
    models: [{
      name: "A",
      properties: [
        { name: "a", type: "string", optional: true },
        { name: "b", type: "string", constraints: [{ kind: "optional" }] },
        { name: "c", type: "string", constraints: [{ kind: "required" }] },
        { name: "d", type: "string", constraints: [{ kind: "required" }, { kind: "optional" }] },
      ],
    }],
  });

  const props = parseExtraction(text).models[0].properties;
  assertEquals(props.map((p) => p.optional), [true, true, false, false]);
  // `optional` constraints are folded into the boolean and removed.
  assertEquals(props[1].constraints, []);
  // `required` constraints are kept for the assertion generator.
  assertEquals(props[2].constraints, [{ kind: "required" }]);
});

Deno.test("parseExtraction normalizes relationships and defaults unknown kinds", () => {
  const text = JSON.stringify({
    models: [{
      name: "Class",
      properties: [],
      relationships: [
        { kind: "many-to-one", target: "Teacher", field: "teacher" },
        { kind: "bogus", target: "Student" }, // unknown kind → default
        { target: "Course" }, // missing kind → default
        { kind: "one-to-many" }, // missing target → dropped
      ],
    }],
  });

  const rels = parseExtraction(text).models[0].relationships;
  assertEquals(rels.length, 3);
  assertEquals(rels[0], { kind: "many-to-one", target: "Teacher", field: "teacher" });
  assertEquals(rels[1], { kind: "one-to-many", target: "Student" });
  assertEquals(rels[2], { kind: "one-to-many", target: "Course" });
});

Deno.test("parseExtraction keeps constraint values with the right shape", () => {
  const text = JSON.stringify({
    models: [{
      name: "Student",
      properties: [
        {
          name: "gradeLevel",
          type: "number",
          constraints: [{ kind: "range", min: 9, max: 12 }],
        },
        {
          name: "email",
          type: "string",
          constraints: [{ kind: "format", value: "email" }],
        },
      ],
    }],
  });

  const props = parseExtraction(text).models[0].properties;
  assertEquals(props[0].constraints, [{ kind: "range", min: 9, max: 12 }]);
  assertEquals(props[1].constraints, [{ kind: "format", value: "email" }]);
});

Deno.test("parseExtraction throws on non-JSON text", () => {
  assertThrows(() => parseExtraction("no json here"));
});

Deno.test("parseExtraction throws when the envelope has no models array", () => {
  assertThrows(() => parseExtraction('{"models": "nope"}'));
});
