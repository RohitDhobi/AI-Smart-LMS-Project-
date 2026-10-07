// Pure helpers for the student "Divisions" page.
// Kept free of React/API imports so they can be unit-tested with node:test.

// The first division flagged `mine` by the backend, or null when the student
// does not belong to any division yet.
export function findMyDivision(divisions) {
  if (!Array.isArray(divisions)) return null;
  return divisions.find((d) => d && d.mine) || null;
}

// Everything except the student's own division, preserving backend order.
export function otherDivisions(divisions) {
  if (!Array.isArray(divisions)) return [];
  return divisions.filter((d) => d && !d.mine);
}

// Occupancy 0-100 for the capacity bar. Missing/invalid counts clamp instead
// of producing NaN so a partial API payload can never break the page.
export function divisionFillPercent(division) {
  const count = Number(division?.studentCount);
  const capacity = Number(division?.maxCapacity);

  if (!Number.isFinite(count) || !Number.isFinite(capacity) || capacity <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((count / capacity) * 100)));
}

// "Sem 3" when a division is semester-bound, "All semesters" otherwise.
export function semesterLabel(division) {
  const semester = division?.semester;

  if (semester === null || semester === undefined || semester === "") {
    return "All semesters";
  }

  return `Sem ${semester}`;
}
