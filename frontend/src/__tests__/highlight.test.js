import { test } from "node:test";
import assert from "node:assert/strict";

import { highlightSegments } from "./highlight.js";

test("returns the whole text unmatched when there is no keyword", () => {
  assert.deepEqual(
    highlightSegments("Java Programming", ""),
    [{ text: "Java Programming", match: false }]
  );
  assert.deepEqual(
    highlightSegments("Java Programming", "   "),
    [{ text: "Java Programming", match: false }]
  );
  assert.deepEqual(
    highlightSegments("Java Programming", null),
    [{ text: "Java Programming", match: false }]
  );
});

test("returns a single match segment", () => {
  assert.deepEqual(
    highlightSegments("Java Programming", "java"),
    [
      { text: "Java", match: true },
      { text: " Programming", match: false }
    ]
  );
});

test("returns no match segments when keyword is absent", () => {
  assert.deepEqual(
    highlightSegments("Java Programming", "python"),
    [{ text: "Java Programming", match: false }]
  );
});

test("highlights every occurrence, case-insensitively", () => {
  assert.deepEqual(
    highlightSegments("Java in Java", "java"),
    [
      { text: "Java", match: true },
      { text: " in ", match: false },
      { text: "Java", match: true }
    ]
  );
});

test("handles keyword at the start and end of the text", () => {
  assert.deepEqual(
    highlightSegments("java", "java"),
    [{ text: "java", match: true }]
  );
  assert.deepEqual(
    highlightSegments("Learn java", "java"),
    [
      { text: "Learn ", match: false },
      { text: "java", match: true }
    ]
  );
});

test("handles empty and non-string input safely", () => {
  assert.deepEqual(
    highlightSegments("", "java"),
    [{ text: "", match: false }]
  );
  assert.deepEqual(
    highlightSegments(undefined, "java"),
    [{ text: "", match: false }]
  );
});
