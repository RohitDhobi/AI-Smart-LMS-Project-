import test from "node:test";
import assert from "node:assert/strict";

import {
  findMyDivision,
  otherDivisions,
  divisionFillPercent,
  semesterLabel,
} from "../store/divisions.js";

const divA = { id: 1, name: "Division A", code: "A", mine: true, studentCount: 12, maxCapacity: 60 };
const divB = { id: 2, name: "Division B", code: "B", mine: false, studentCount: 30, maxCapacity: 60 };
const divC = { id: 3, name: "Division C", code: "C", mine: false, studentCount: 0, maxCapacity: 60 };

test("findMyDivision returns the flagged division", () => {
  assert.equal(findMyDivision([divA, divB]), divA);
});

test("findMyDivision returns null when nobody is flagged", () => {
  assert.equal(findMyDivision([divB, divC]), null);
  assert.equal(findMyDivision([]), null);
});

test("findMyDivision tolerates non-array input", () => {
  assert.equal(findMyDivision(null), null);
  assert.equal(findMyDivision(undefined), null);
  assert.equal(findMyDivision("nope"), null);
});

test("otherDivisions drops the student's own division", () => {
  assert.deepEqual(otherDivisions([divA, divB, divC]), [divB, divC]);
  assert.deepEqual(otherDivisions([divA]), []);
  assert.deepEqual(otherDivisions(null), []);
});

test("divisionFillPercent computes occupancy", () => {
  assert.equal(divisionFillPercent(divA), 20);
  assert.equal(divisionFillPercent(divB), 50);
  assert.equal(divisionFillPercent(divC), 0);
});

test("divisionFillPercent clamps above 100 and handles bad data", () => {
  assert.equal(divisionFillPercent({ studentCount: 90, maxCapacity: 60 }), 100);
  assert.equal(divisionFillPercent({ studentCount: -5, maxCapacity: 60 }), 0);
  assert.equal(divisionFillPercent({ studentCount: 5, maxCapacity: 0 }), 0);
  assert.equal(divisionFillPercent({}), 0);
  assert.equal(divisionFillPercent(null), 0);
});

test("semesterLabel shows bound semesters", () => {
  assert.equal(semesterLabel({ semester: 3 }), "Sem 3");
  assert.equal(semesterLabel({ semester: 1 }), "Sem 1");
});

test("semesterLabel falls back to all semesters", () => {
  assert.equal(semesterLabel({ semester: null }), "All semesters");
  assert.equal(semesterLabel({}), "All semesters");
  assert.equal(semesterLabel(null), "All semesters");
});
