// =====================================================
// AI SMART LMS - DASHBOARD HELPERS
// =====================================================

// Decide what the "Latest results" panel should show
// when there are no rows to display.
//
// Returns:
//   null    - there are results, show the list
//   "search"- enrolled but nothing matched the search
//   "fresh" - student has no enrollments yet
//
export function emptyResultsState(enrolledCourses, resultCount) {
  if (Number(resultCount) > 0) {
    return null;
  }
  return (Number(enrolledCourses) || 0) > 0 ? "search" : "fresh";
}
