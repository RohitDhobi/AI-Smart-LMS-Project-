import { test } from "node:test";
import assert from "node:assert/strict";

import {
  enrollmentCourseId,
  enrolledCourseIds,
  resolveEnrolledCourses,
} from "../store/enrollment.js";

test("enrollmentCourseId reads course.id, then courseId", () => {
  assert.equal(enrollmentCourseId({ course: { id: 7 } }), 7);
  assert.equal(enrollmentCourseId({ courseId: 3 }), 3);
  assert.equal(enrollmentCourseId({ course_id: 9 }), 9);
  // course.id wins when both are present
  assert.equal(enrollmentCourseId({ course: { id: 7 }, courseId: 3 }), 7);
});

test("enrollmentCourseId returns null for missing or junk ids", () => {
  assert.equal(enrollmentCourseId(null), null);
  assert.equal(enrollmentCourseId({}), null);
  assert.equal(enrollmentCourseId({ course: {} }), null);
  assert.equal(enrollmentCourseId({ course: { id: "abc" } }), null);
  assert.equal(enrollmentCourseId({ course: { id: 0 } }), null);
});

test("enrolledCourseIds collects unique course ids and skips bad rows", () => {
  const ids = enrolledCourseIds([
    { course: { id: 1 } },
    { course: { id: 2 } },
    { course: { id: 1 } }, // duplicate
    { nope: true }, // unusable row
  ]);

  assert.deepEqual([...ids].sort(), [1, 2]);
  assert.deepEqual([...enrolledCourseIds(null)], []);
});

test("resolveEnrolledCourses prefers the catalog copy of the course", () => {
  const catalog = [
    { id: 1, title: "Java Programming", price: 0 },
    { id: 2, title: "DBMS" },
  ];

  const resolved = resolveEnrolledCourses(
    [{ id: 10, course: { id: 1, title: "stale title" } }],
    catalog
  );

  assert.equal(resolved.length, 1);
  assert.equal(resolved[0].title, "Java Programming");
});

test("resolveEnrolledCourses falls back to the embedded course", () => {
  const resolved = resolveEnrolledCourses([
    { id: 11, course: { id: 5, title: "Data Structures" } },
  ]);

  assert.equal(resolved.length, 1);
  assert.equal(resolved[0].id, 5);
  assert.equal(resolved[0].title, "Data Structures");
});

test("resolveEnrolledCourses keeps an id-only enrollment renderable", () => {
  const resolved = resolveEnrolledCourses([{ id: 12, course: { id: 8 } }]);

  assert.equal(resolved.length, 1);
  assert.equal(resolved[0].id, 8);
});

test("resolveEnrolledCourses dedupes and ignores unusable rows", () => {
  const resolved = resolveEnrolledCourses(
    [
      { course: { id: 1 } },
      { courseId: 1 },
      { course: { id: 2 } },
      { user: { id: 3 } },
      "garbage",
    ],
    [{ id: 2, title: "Only catalog match" }]
  );

  assert.deepEqual(
    resolved.map((c) => c.id),
    [1, 2]
  );
  assert.equal(resolved[1].title, "Only catalog match");
});

test("resolveEnrolledCourses handles empty/non-array input", () => {
  assert.deepEqual(resolveEnrolledCourses(null), []);
  assert.deepEqual(resolveEnrolledCourses(undefined, null), []);
  assert.deepEqual(resolveEnrolledCourses([], [{ id: 1 }]), []);
});
