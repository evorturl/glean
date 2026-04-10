import assert from "node:assert/strict";
import test from "node:test";

import {
  parseArgs,
  readBooleanFlag,
  readNumberFlag,
  readStringFlag,
} from "../src/cli-flags.ts";

test("readBooleanFlag accepts kebab-case false values", () => {
  const parsed = parseArgs([
    "ask",
    "--include-citations",
    "false",
    "--question",
    "hello",
  ]);

  assert.equal(readBooleanFlag(parsed, "include-citations"), false);
  assert.equal(readStringFlag(parsed, "question"), "hello");
});

test("readBooleanFlag accepts camelCase aliases", () => {
  const parsed = parseArgs([
    "ask",
    "--includeCitations",
    "false",
    "--question",
    "hello",
  ]);

  assert.equal(
    readBooleanFlag(parsed, ["include-citations", "includeCitations"]),
    false,
  );
});

test("readNumberFlag parses numeric values", () => {
  const parsed = parseArgs(["ask", "--top-k", "5"]);

  assert.equal(readNumberFlag(parsed, "top-k"), 5);
});
