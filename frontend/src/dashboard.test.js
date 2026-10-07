import { test } from "node:test";
import assert from "node:assert/strict";

import { emptyResultsState } from "./dashboard.js";

test("returns null when there are results to show", () => {
  assert.equal(emptyResultsState(0, 1), null);
  assert.equal(emptyResultsState(3, 2), null);
  assert.equal(emptyResultsState(undefined, 5), null);
});

test("returns 'search' when enrolled but the search matched nothing", () => {
  assert.equal(emptyResultsState(3, 0), "search");
  assert.equal(emptyResultsState(1, 0), "search");
});

test("returns 'fresh' when the student has no enrollments", () => {
  assert.equal(emptyResultsState(0, 0), "fresh");
  assert.equal(emptyResultsState(undefined, 0), "fresh");
  assert.equal(emptyResultsState(null, 0), "fresh");
});
