import { test } from "node:test";
import assert from "node:assert/strict";

import { api, _setBackendDown } from "./api.js";

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

test("an HTTP error does not switch the app into offline mode", async () => {
  stubStorage();
  _setBackendDown(false);

  // any successful call keeps the app online
  stubFetch(200, JSON.stringify([{ id: 1, name: "Division A" }]));
  await api.hodDivisions();

  // the API rejects a request...
  stubFetch(400, JSON.stringify({ error: "Division not found with id -1" }));
  await assert.rejects(
    () => api.hodDivision("-1"),
    /Division not found with id -1/
  );

  // ...which must NOT be mistaken for "backend unreachable": the next call
  // still hits the network and returns real rows instead of the id:-1 mocks.
  const calls = stubFetch(
    200,
    JSON.stringify([{ id: 1, name: "Division A" }])
  );
  const list = await api.hodDivisions();

  assert.equal(calls.length, 1, "backend must still be used after an API error");
  assert.equal(list[0].id, 1, "must return real data, not mock divisions");
});

test("an unknown division id rejects instead of resolving to a mock", async () => {
  stubStorage();
  _setBackendDown(false);

  stubFetch(404, JSON.stringify({ error: "Division not found with id 999" }));

  await assert.rejects(
    () => api.hodDivision("999"),
    /Division not found with id 999/
  );
});

test("a network failure marks the backend down and serves the sample list", async () => {
  stubStorage();
  _setBackendDown(false);

  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };

  const list = await api.hodDivisions();

  assert.equal(list[0].mock, true, "offline fallback should be flagged as mock");
  assert.ok(list.every((d) => d.id < 0), "sample rows use negative ids");

  _setBackendDown(false);
});
