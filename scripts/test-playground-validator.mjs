import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  configFile: "vite.config.demo.ts",
  server: { middlewareMode: true },
  appType: "custom",
});

try {
  const { validateSchema } = await server.ssrLoadModule(
    "/demo/utils/validateSchema.ts",
  );

  const { allExamples } = await server.ssrLoadModule("/demo/data/examples.ts");

  function isJsonSerializable(value) {
    if (value === null) return true;

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return true;
    }

    if (Array.isArray(value)) {
      return value.every(isJsonSerializable);
    }

    if (typeof value === "object") {
      const prototype = Object.getPrototypeOf(value);

      if (prototype !== Object.prototype && prototype !== null) {
        return false;
      }

      return Object.values(value).every(isJsonSerializable);
    }

    return false;
  }

  const playgroundExamples = allExamples.filter((example) =>
    isJsonSerializable(example.schema),
  );

  test("every JSON-serializable Playground example passes validation", () => {
    assert.ok(playgroundExamples.length > 0, "No examples were loaded");

    const failures = [];

    for (const example of playgroundExamples) {
      const error = validateSchema(example.schema);

      if (error) {
        failures.push(`${example.id}: ${error}`);
      }
    }

    assert.deepEqual(failures, [], failures.join("\n"));
  });

  test("rejects object fields left on a text field", () => {
    const schema = {
      fields: [
        {
          name: "profile",
          type: "text",
          fields: [
            {
              name: "firstName",
              type: "text",
            },
          ],
        },
      ],
    };

    assert.match(
      validateSchema(schema),
      /fields is only valid for object fields/,
    );
  });

  const invalidCases = [
    ["missing field name", { fields: [{ type: "text" }] }],
    ["unsupported field type", { fields: [{ name: "x", type: "unknown" }] }],
    [
      "bad select options",
      {
        fields: [{ name: "x", type: "select", options: "bad" }],
      },
    ],
    [
      "bad option label",
      {
        fields: [
          {
            name: "x",
            type: "select",
            options: [{ value: "a" }],
          },
        ],
      },
    ],
    [
      "missing hidden default",
      {
        fields: [{ name: "secret", type: "hidden" }],
      },
    ],
    [
      "bad condition",
      {
        fields: [
          {
            name: "x",
            type: "text",
            dependsOn: "bad",
          },
        ],
      },
    ],
    [
      "bad compound condition",
      {
        fields: [
          {
            name: "x",
            type: "text",
            dependsOn: { all: "bad" },
          },
        ],
      },
    ],
    [
      "bad dynamic options",
      {
        fields: [
          {
            name: "x",
            type: "select",
            optionsFrom: { field: "country", map: { us: "bad" } },
          },
        ],
      },
    ],
    [
      "bad fillFrom",
      {
        fields: [
          {
            name: "x",
            type: "text",
            fillFrom: { trigger: "" },
          },
        ],
      },
    ],
    [
      "bad validation rule",
      {
        fields: [
          {
            name: "x",
            type: "text",
            validation: { min: "not-a-number" },
          },
        ],
      },
    ],
    [
      "bad nested object",
      {
        fields: [
          {
            name: "x",
            type: "object",
            fields: [{ type: "text" }],
          },
        ],
      },
    ],
    [
      "bad array item schema",
      {
        fields: [
          {
            name: "x",
            type: "array",
            itemSchema: { name: "item" },
          },
        ],
      },
    ],
  ];

  for (const [name, schema] of invalidCases) {
    test(`rejects ${name}`, () => {
      assert.equal(
        typeof validateSchema(schema),
        "string",
        `Expected invalid schema to be rejected: ${name}`,
      );
    });
  }
} finally {
  await server.close();
}
