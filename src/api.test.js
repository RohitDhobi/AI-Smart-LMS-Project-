import { test } from "node:test";
import assert from "node:assert/strict";

import { api } from "./api.js";

function stubStorage() {
  const store = {};
  globalThis.localStorage = {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; }
  };
}

function stubFetch(status = 200, body = "[]") {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => body
    };
  };
  return calls;
}

test("searchCourses calls /api/courses/search with an encoded keyword", async () => {
  stubStorage();
  const calls = stubFetch();

  await api.searchCourses("java basics");

  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/api\/courses\/search\?keyword=java%20basics$/);
});

test("searchCourses sends the JWT when a token is stored", async () => {
  stubStorage();
  globalThis.localStorage.setItem("token", "my-jwt-token");
  const calls = stubFetch();

  await api.searchCourses("java");

  assert.equal(
    calls[0].options.headers.Authorization,
    "Bearer my-jwt-token"
  );
});

test("searchCourses sends an empty keyword when none is provided", async () => {
  stubStorage();
  const calls = stubFetch();

  await api.searchCourses();

  assert.match(calls[0].url, /\/api\/courses\/search\?keyword=$/);
});
