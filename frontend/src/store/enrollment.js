// =====================================================
// AI SMART LMS - ENROLLMENT HELPERS
// =====================================================
//
// GET /api/enrollments/my returns rows shaped like
//   { id, user: {...}, course: { id, title, ... } }
// but older/leaner responses only carry a courseId. These helpers keep the
// "My Enrolled Courses" view working with either shape.

/** Course id of a single enrollment row, or null when it can't be determined. */
export function enrollmentCourseId(enrollment) {
  const raw =
    enrollment?.course?.id ??
    enrollment?.courseId ??
    enrollment?.course_id ??
    null;

  const id = Number(raw);

  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * Resolve enrollment rows into renderable course objects.
 *
 * - rows without a usable course id are skipped
 * - duplicate rows for the same course are collapsed
 * - the catalog copy (when found) wins, so the card matches the browse grid;
 *   otherwise the course embedded in the enrollment is used as-is
 */
export function resolveEnrolledCourses(enrollments, catalog = []) {
  const rows = Array.isArray(enrollments) ? enrollments : [];
  const byId = new Map(
    (Array.isArray(catalog) ? catalog : [])
      .filter((course) => course && course.id != null)
      .map((course) => [Number(course.id), course])
  );

  const seen = new Set();
  const resolved = [];

  for (const row of rows) {
    const id = enrollmentCourseId(row);

    if (id === null || seen.has(id)) {
      continue;
    }

    seen.add(id);

    const embedded =
      row?.course && typeof row.course === "object" ? row.course : null;

    let course = byId.get(id) || embedded;

    if (!course) {
      continue; // only an id was returned - nothing to render
    }

    if (course.id == null) {
      course = { ...course, id };
    }

    resolved.push(course);
  }

  return resolved;
}

/** Set of enrolled course ids, handy for filtering the browse grid. */
export function enrolledCourseIds(enrollments) {
  return new Set(
    (Array.isArray(enrollments) ? enrollments : [])
      .map(enrollmentCourseId)
      .filter((id) => id !== null)
  );
}
