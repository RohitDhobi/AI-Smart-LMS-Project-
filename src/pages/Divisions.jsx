import React, { useEffect, useState } from "react";
import { api } from "../api";
import { Loading, Empty } from "../ui";
import {
  findMyDivision,
  otherDivisions,
  divisionFillPercent,
  semesterLabel,
} from "../divisions";

// =====================================================
// STUDENT DIVISIONS
// Read-only view of the divisions (sections) of the
// student's own course. Division management stays with
// the HOD panel - students can only see them here.
// =====================================================

function Divisions() {

  const [data, setData] = useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    async function load() {

      try {

        const result =
          await api.myDivisions();

        setData(result || null);

      } catch (e) {

        console.error(e);

      } finally {

        setLoading(false);

      }
    }

    load();

  }, []);


  if (loading) {
    return <Loading />;
  }


  const divisions =
    Array.isArray(data?.divisions)
      ? data.divisions
      : [];

  const mine =
    data?.myDivision ||
    findMyDivision(divisions);

  const grid =
    mine
      ? otherDivisions(divisions)
      : divisions;

  const cardTints = [
    "blue",
    "orange",
    "purple",
    "green"
  ];


  return (

    <div className="page divisions-page">

      {/* hero banner */}

      <div className="analytics-hero">

        <div>

          <h2>🧩 My Divisions</h2>

          <p>
            {data?.courseName
              ? `${data.courseCode ? data.courseCode + " — " : ""}${data.courseName}`
              : "Sections of your course."}
          </p>

        </div>

        {mine && (
          <span className="division-hero-badge">
            ✓ {mine.name}
          </span>
        )}

      </div>


      {divisions.length === 0 ? (

        <Empty
          text="No divisions have been created for your course yet. Your HOD can create them from the division manager."
        />

      ) : (

        <>

          {/* my own division, highlighted */}

          {mine && (

            <section className="card division-mine-card">

              <div className="courses-heading-row">

                <h3>🎓 My Division</h3>

                <span className="course-enrolled-chip">
                  You
                </span>

              </div>

              <div className="division-mine-grid">

                <div>
                  <span className="division-field-label">Division</span>
                  <strong>
                    {mine.name}
                    {mine.code ? ` (${mine.code})` : ""}
                  </strong>
                </div>

                <div>
                  <span className="division-field-label">Course</span>
                  <strong>
                    {mine.courseName ||
                      data?.courseName ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span className="division-field-label">Semester</span>
                  <strong>{semesterLabel(mine)}</strong>
                </div>

                <div>
                  <span className="division-field-label">Academic year</span>
                  <strong>{mine.academicYear || "—"}</strong>
                </div>

                <div>
                  <span className="division-field-label">Class teacher</span>
                  <strong>{mine.classTeacherName || "Not assigned"}</strong>
                </div>

                <div>
                  <span className="division-field-label">Students</span>
                  <strong>
                    {mine.studentCount ?? 0} / {mine.maxCapacity ?? "—"}
                  </strong>
                </div>

              </div>

              <div className="division-capacity-bar">

                <span
                  style={{
                    width: `${divisionFillPercent(mine)}%`
                  }}
                />

              </div>

            </section>

          )}


          <div className="courses-heading-row">

            <h3>
              {mine ? "Other Divisions" : "All Divisions"}
            </h3>

            <span>
              {grid.length}{" "}
              {grid.length === 1
                ? "division"
                : "divisions"}
            </span>

          </div>


          {grid.length === 0 ? (

            <Empty
              text="There are no other divisions in your course."
            />

          ) : (

            <div className="divisions-grid">

              {grid.map((division, index) => (

                <div
                  className={
                    `card division-card` +
                    (division.mine
                      ? " division-card-mine"
                      : "")
                  }
                  key={division.id ?? index}
                >

                  <div className="division-card-top">

                    <span className="division-code-chip">
                      {division.code || "—"}
                    </span>

                    {division.mine && (
                      <span className="course-enrolled-chip">
                        You
                      </span>
                    )}

                  </div>

                  <h3>{division.name}</h3>

                  <p className="division-card-meta">
                    {semesterLabel(division)}
                    {" · "}
                    {division.academicYear || "—"}
                    {division.courseName
                      ? ` · ${division.courseName}`
                      : ""}
                  </p>

                  <p className="division-card-teacher">
                    👨‍🏫{" "}
                    {division.classTeacherName ||
                      "No class teacher yet"}
                  </p>

                  <div className="division-capacity-bar">

                    <span
                      style={{
                        width: `${divisionFillPercent(division)}%`
                      }}
                    />

                  </div>

                  <div className="division-card-footer">

                    <span>
                      {division.studentCount ?? 0} students
                    </span>

                    <span>
                      Cap {division.maxCapacity ?? "—"}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </>

      )}

    </div>
  );
}


export default Divisions;
