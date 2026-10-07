import React, { useState } from "react";
import InstructorPage from "./InstructorPage";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const EVENTS = [
  { date: 15, title: "Assignment Due", type: "assignment", course: "Java Programming" },
  { date: 18, title: "Quiz", type: "quiz", course: "Web Development" },
  { date: 22, title: "Lecture", type: "lecture", course: "Database Systems" },
  { date: 25, title: "Mid-term Exam", type: "exam", course: "Data Structures" },
  { date: 28, title: "Office Hours", type: "meeting", course: "All Courses" },
];

export default function InstructorCalendar() {
  const [currentMonth] = useState(7); // August (0-indexed)
  const [currentYear] = useState(2026);
  const [selectedDate, setSelectedDate] = useState(null);

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const getEventsForDay = (day) => EVENTS.filter((e) => e.date === day);

  return (
    <InstructorPage icon="📅" title="Calendar" subtitle="Manage your schedule and upcoming events">
      <div className="inst-content">
        <div className="inst-calendar-layout">
          {/* Calendar Grid */}
          <div className="inst-calendar-card">
            <div className="inst-calendar-header">
              <button className="inst-btn inst-btn-sm inst-btn-outline">← Prev</button>
              <h3>{MONTHS[currentMonth]} {currentYear}</h3>
              <button className="inst-btn inst-btn-sm inst-btn-outline">Next →</button>
            </div>

            <div className="inst-calendar-grid">
              {DAYS.map((d) => (
                <div key={d} className="inst-calendar-day-label">{d}</div>
              ))}
              {calendarDays.map((day, i) => {
                const dayEvents = day ? getEventsForDay(day) : [];
                return (
                  <div
                    key={i}
                    className={`inst-calendar-day ${day ? "" : "empty"} ${selectedDate === day ? "selected" : ""} ${day === new Date().getDate() ? "today" : ""}`}
                    onClick={() => day && setSelectedDate(day)}
                  >
                    {day && <span className="day-number">{day}</span>}
                    {dayEvents.map((e, j) => (
                      <div key={j} className={`calendar-event-dot ${e.type}`} title={e.title} />
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Event Legend */}
            <div className="inst-calendar-legend">
              <span><i className="event-dot assignment" /> Assignments</span>
              <span><i className="event-dot quiz" /> Quizzes</span>
              <span><i className="event-dot exam" /> Exams</span>
              <span><i className="event-dot lecture" /> Lectures</span>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="inst-upcoming-events">
            <h3>Upcoming Events</h3>
            <div className="inst-events-list">
              {EVENTS.map((e, i) => (
                <div key={i} className={`inst-event-item type-${e.type}`}>
                  <div className="inst-event-date">
                    <strong>{e.date}</strong>
                    <small>{MONTHS[currentMonth].slice(0, 3)}</small>
                  </div>
                  <div className="inst-event-info">
                    <strong>{e.title}</strong>
                    <span>{e.course}</span>
                  </div>
                  <span className={`inst-event-type-badge ${e.type}`}>{e.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </InstructorPage>
  );
}
