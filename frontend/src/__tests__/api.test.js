import { test } from "node:test";
import assert from "node:assert/strict";

import { api, _setBackendDown } from "../services/api.js";

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

// =====================================================
// EXAM APPROVAL WORKFLOW ENDPOINTS
// =====================================================

test("submitExamForApproval posts to the workflow endpoint", async () => {
  stubStorage();
  globalThis.localStorage.setItem("token", "jwt-1");
  const calls = stubFetch(200, JSON.stringify({ id: 5, status: "PENDING_HOD_APPROVAL" }));

  const result = await api.submitExamForApproval(5);

  assert.equal(calls[0].url, `${"http://localhost:8080/api"}/exams/5/submit-for-approval`);
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers.Authorization, "Bearer jwt-1");
  assert.equal(result.status, "PENDING_HOD_APPROVAL");
});

test("publishExam posts to the publish endpoint", async () => {
  stubStorage();
  const calls = stubFetch(200, JSON.stringify({ id: 5, status: "PUBLISHED" }));

  await api.publishExam(5);

  assert.equal(calls[0].url, `${"http://localhost:8080/api"}/exams/5/publish`);
  assert.equal(calls[0].options.method, "POST");
});

test("publishing an unapproved exam surfaces the backend 403 message", async () => {
  stubStorage();
  _setBackendDown(false);
  stubFetch(403, JSON.stringify({
    error: "Exam must be approved by HOD before publishing."
  }));

  await assert.rejects(
    () => api.publishExam(7),
    /Exam must be approved by HOD before publishing\./
  );

  // an auth failure must not flip the app into offline/mock mode
  const calls = stubFetch(200, JSON.stringify([{ id: 1 }]));
  assert.equal((await api.exams()).length, 1);
  assert.equal(calls.length, 1);
});

test("hodRejectExam sends the mandatory rejection reason", async () => {
  stubStorage();
  const calls = stubFetch(200, JSON.stringify({ id: 9, status: "REJECTED" }));

  await api.hodRejectExam(9, "Section C contains insufficient 3-mark questions.");

  assert.equal(calls[0].url, `${"http://localhost:8080/api"}/hod/exam-approvals/9/reject`);
  assert.equal(calls[0].options.method, "POST");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    reason: "Section C contains insufficient 3-mark questions."
  });
});

test("hodApproveExam posts to the approve endpoint", async () => {
  stubStorage();
  const calls = stubFetch(200, JSON.stringify({ id: 9, status: "APPROVED" }));

  await api.hodApproveExam(9);

  assert.equal(calls[0].url, `${"http://localhost:8080/api"}/hod/exam-approvals/9/approve`);
  assert.equal(calls[0].options.method, "POST");
});

test("hodExamApprovals encodes the status filter", async () => {
  stubStorage();
  const calls = stubFetch(200, "[]");

  await api.hodExamApprovals("PENDING_HOD_APPROVAL");
  assert.match(
    calls[0].url,
    /\/api\/hod\/exam-approvals\?status=PENDING_HOD_APPROVAL$/
  );

  const calls2 = stubFetch(200, "[]");
  await api.hodExamApprovals();
  assert.equal(calls2[0].url, `${"http://localhost:8080/api"}/hod/exam-approvals`);
});

test("myExams and adminSetExamStatus hit the right endpoints", async () => {
  stubStorage();
  const calls = stubFetch(200, "[]");

  await api.myExams();
  assert.equal(calls[0].url, `${"http://localhost:8080/api"}/exams/mine`);

  const calls2 = stubFetch(200, JSON.stringify({ id: 3, status: "PUBLISHED" }));
  await api.adminSetExamStatus(3, "PUBLISHED");
  assert.equal(calls2[0].url, `${"http://localhost:8080/api"}/exams/3/status`);
  assert.equal(calls2[0].options.method, "PUT");
  assert.deepEqual(JSON.parse(calls2[0].options.body), { status: "PUBLISHED" });
});

test("unenroll calls DELETE /api/enrollments with the course id", async () => {
  stubStorage();
  globalThis.localStorage.setItem("token", "my-jwt-token");
  const calls = stubFetch(
    200,
    JSON.stringify({ message: "Unenrolled successfully" })
  );

  await api.unenroll(5);

  assert.match(calls[0].url, /\/api\/enrollments\?courseId=5$/);
  assert.equal(calls[0].options.method, "DELETE");
  assert.equal(
    calls[0].options.headers.Authorization,
    "Bearer my-jwt-token"
  );
});

test("allEnrollments and manageEnroll hit the right endpoints", async () => {
  stubStorage();

  const calls = stubFetch(200, "[]");
  await api.allEnrollments();
  assert.equal(calls[0].url, "http://localhost:8080/api/enrollments/all");

  const calls2 = stubFetch(200, JSON.stringify({ id: 99 }));
  await api.manageEnroll(2, 1);
  assert.match(
    calls2[0].url,
    /\/api\/enrollments\/manage\?studentId=2&courseId=1$/
  );
  assert.equal(calls2[0].options.method, "POST");
});

test("manageRemove DELETEs the enrollment by id", async () => {
  stubStorage();
  const calls = stubFetch(
    200,
    JSON.stringify({ message: "Enrollment removed" })
  );

  await api.manageRemove(99);

  assert.match(calls[0].url, /\/api\/enrollments\/manage\/99$/);
  assert.equal(calls[0].options.method, "DELETE");
});
