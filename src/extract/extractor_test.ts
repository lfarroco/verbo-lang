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
        {
          name: "d",
          type: "string",
          constraints: [{ kind: "required" }, { kind: "optional" }],
        },
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

Deno.test("parseExtraction normalizes nullable and keeps the new constraint kinds", () => {
  const text = JSON.stringify({
    models: [{
      name: "Todo",
      properties: [
        { name: "id", type: "number", constraints: [{ kind: "primaryKey" }] },
        {
          name: "status",
          type: "string",
          constraints: [{ kind: "default", value: "active" }],
        },
        { name: "email", type: "string", constraints: [{ kind: "unique" }] },
        { name: "nickname", type: "string", nullable: true },
        {
          name: "nickname2",
          type: "string",
          constraints: [{ kind: "nullable" }],
        },
        {
          name: "title",
          type: "string",
          constraints: [
            { kind: "minLength", value: 3 },
            { kind: "maxLength", value: 80 },
            { kind: "pattern", value: "^[A-Za-z]" },
          ],
        },
        {
          name: "tags",
          type: "string[]",
          constraints: [{ kind: "size", min: 1, max: 5 }],
        },
      ],
    }],
  });

  const props = parseExtraction(text).models[0].properties;
  assertEquals(
    props.map((p) => p.nullable),
    [false, false, false, true, true, false, false],
  );
  assertEquals(props[0].constraints, [{ kind: "primaryKey" }]);
  assertEquals(props[1].constraints, [{ kind: "default", value: "active" }]);
  assertEquals(props[2].constraints, [{ kind: "unique" }]);
  // `nullable` constraint kinds fold into the boolean and are removed.
  assertEquals(props[4].constraints, []);
  assertEquals(props[5].constraints, [
    { kind: "minLength", value: 3 },
    { kind: "maxLength", value: 80 },
    { kind: "pattern", value: "^[A-Za-z]" },
  ]);
  assertEquals(props[6].constraints, [{ kind: "size", min: 1, max: 5 }]);
});

Deno.test("parseExtraction required wins over nullable", () => {
  const text = JSON.stringify({
    models: [{
      name: "A",
      properties: [{
        name: "a",
        type: "string",
        nullable: true,
        constraints: [{ kind: "required" }],
      }],
    }],
  });

  const props = parseExtraction(text).models[0].properties;
  assertEquals(props[0].nullable, false);
});

Deno.test("parseExtraction keeps model-reference properties and ignores a stray relationships key", () => {
  const text = JSON.stringify({
    models: [{
      name: "Class",
      properties: [
        { name: "teacher", type: "Teacher" },
        { name: "students", type: "Student[]" },
      ],
      relationships: [
        { kind: "one-to-many", target: "Student", field: "students" },
      ],
    }],
  });

  const props = parseExtraction(text).models[0].properties;
  assertEquals(props.length, 2);
  assertEquals(props[0].name, "teacher");
  assertEquals(props[0].type, "Teacher");
  assertEquals(props[0].optional, false);
  assertEquals(props[1].name, "students");
  assertEquals(props[1].type, "Student[]");
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

Deno.test("parseExtraction parses functions with params and returnType", () => {
  const text = JSON.stringify({
    models: [],
    functions: [
      {
        name: "formatEnrollmentDate",
        source: "functions.md",
        params: [{ name: "date", type: "date" }],
        returnType: "string",
      },
      {
        name: "averageClassSize",
        source: "functions.md",
        params: [{ name: "classes", type: "Class[]" }],
        returnType: "number",
      },
    ],
  });

  const spec = parseExtraction(text);
  assertEquals(spec.models.length, 0);
  assertEquals(spec.functions!.length, 2);
  assertEquals(spec.functions![0].name, "formatEnrollmentDate");
  assertEquals(spec.functions![0].source, "functions.md");
  // Params reuse the property normalizer, so they carry optional/nullable and
  // constraints.
  assertEquals(spec.functions![0].params, [
    {
      name: "date",
      type: "date",
      optional: false,
      nullable: false,
      constraints: [],
    },
  ]);
  assertEquals(spec.functions![0].returnType, "string");
  assertEquals(spec.functions![1].params, [
    {
      name: "classes",
      type: "Class[]",
      optional: false,
      nullable: false,
      constraints: [],
    },
  ]);
  assertEquals(spec.functions![1].returnType, "number");
});

Deno.test("parseExtraction defaults missing function fields and drops malformed entries", () => {
  const text = JSON.stringify({
    models: [],
    functions: [
      { name: "noop", params: [] }, // no returnType → "void"
      { name: "sloppy" }, // no params → []
      { name: "", params: [] }, // missing name → dropped
      { params: [{ name: "x", type: "number" }] }, // missing name → dropped
      "junk", // not an object → dropped
      null,
    ],
  });

  const spec = parseExtraction(text);
  assertEquals(spec.functions!.length, 2);
  assertEquals(spec.functions![0].name, "noop");
  assertEquals(spec.functions![0].params, []);
  assertEquals(spec.functions![0].returnType, "void");
  assertEquals(spec.functions![1].params, []);
  assertEquals(spec.functions![1].returnType, "void");
});

Deno.test("parseExtraction defaults functions to [] when the envelope omits it", () => {
  const spec = parseExtraction(
    '{"models": [{"name": "Todo", "properties": []}]}',
  );
  assertEquals(spec.functions, []);
});

Deno.test("parseExtraction throws on non-JSON text", () => {
  assertThrows(() => parseExtraction("no json here"));
});

Deno.test("parseExtraction throws when the envelope has no models array", () => {
  assertThrows(() => parseExtraction('{"models": "nope"}'));
});
