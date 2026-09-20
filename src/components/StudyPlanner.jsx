import React, { useState, useEffect } from 'react';
import { api } from '../api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = ['6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM'];

function generateStudyPlan(courses, hoursPerDay = 3, preferredTime = 'evening') {
  const plan = [];
  const coursesPerDay = Math.ceil(courses.length / 7);
  
  // Calculate study sessions per course
  const sessions = courses.map(course => ({
    course,
    sessionsNeeded: Math.max(2, Math.ceil((course.totalLessons || 20) / 10)),
    sessionsCompleted: 0,
  }));

  // Generate weekly plan
  DAYS.forEach((day, dayIndex) => {
    const dayPlan = { day, sessions: [] };
    
    // Select courses for this day
    const dayCourses = sessions
      .filter((_, i) => i % 7 === dayIndex)
      .slice(0, 2); // Max 2 courses per day
    
    dayCourses.forEach((session, i) => {
      const startTime = preferredTime === 'morning' ? 8 + (i * 2) : 18 + (i * 2);
      const duration = hoursPerDay / dayCourses.length;
      
      dayPlan.sessions.push({
        course: session.course,
        startTime: `${startTime}:00`,
        endTime: `${startTime + Math.floor(duration)}:${(duration % 1) * 60 || '00'}`,
        duration: Math.round(duration * 60),
        type: session.sessionsCompleted < session.sessionsNeeded ? 'study' : 'review',
      });
      
      session.sessionsCompleted++;
    });
    
    plan.push(dayPlan);
  });
  
  return plan;
}

function getStudyTips(courses) {
  const tips = [
    { icon: '🎯', text: 'Focus on one topic at a time for better retention' },
    { icon: '⏱️', text: 'Use Pomodoro technique: 25 min study, 5 min break' },
    { icon: '📝', text: 'Take notes while studying to improve memory' },
    { icon: '🔄', text: 'Review previous material before starting new topics' },
    { icon: '💤', text: 'Get 7-8 hours of sleep for optimal learning' },
    { icon: '🏃', text: 'Exercise regularly to boost brain function' },
    { icon: '🥗', text: 'Eat healthy snacks while studying' },
    { icon: '📱', text: 'Keep your phone in another room while studying' },
  ];
  
  // Rotate tips based on day
  const dayIndex = new Date().getDay();
  return tips.slice(dayIndex, dayIndex + 3).concat(tips.slice(0, Math.max(0, 3 - (tips.length - dayIndex))));
}

export function StudyPlanner() {
  const [courses, setCourses] = useState([]);
  const [plan, setPlan] = useState([]);
  const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [preferredTime, setPreferredTime] = useState('evening');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      try {
        const list = await api.courses();
        if (Array.isArray(list)) {
          setCourses(list.slice(0, 7)); // Limit to 7 courses
        }
      } catch {
        // Use fallback
        setCourses([
          { id: 1, title: 'Java Programming', totalLessons: 24 },
          { id: 2, title: 'Python Basics', totalLessons: 18 },
          { id: 3, title: 'Web Development', totalLessons: 32 },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  useEffect(() => {
    if (courses.length > 0) {
      const newPlan = generateStudyPlan(courses, hoursPerDay, preferredTime);
      setPlan(newPlan);
    }
  }, [courses, hoursPerDay, preferredTime]);

  const tips = getStudyTips(courses);
  const selectedDayPlan = plan.find(p => p.day === selectedDay);
  const todaySchedule = plan.find(p => p.day === DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);

  if (loading) {
    return (
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 24,
        textAlign: 'center',
      }}>
        <div className="loading-spinner" style={{ margin: '0 auto' }} />
        <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>Generating your study plan...</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: 24,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
      }}>
        <div style={{
          width: 60,
          height: 60,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
        }}>
          📅
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>AI Study Planner</h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            Personalized schedule for optimal learning
          </p>
        </div>
      </div>

      {/* Settings */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 20,
        flexWrap: 'wrap',
      }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Hours/Day
          </label>
          <select
            value={hoursPerDay}
            onChange={e => setHoursPerDay(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              fontSize: 13,
            }}
          >
            {[1, 2, 3, 4, 5].map(h => (
              <option key={h} value={h}>{h} hours</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Preferred Time
          </label>
          <select
            value={preferredTime}
            onChange={e => setPreferredTime(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              fontSize: 13,
            }}
          >
            <option value="morning">Morning (8 AM - 12 PM)</option>
            <option value="evening">Evening (6 PM - 10 PM)</option>
          </select>
        </div>
      </div>

      {/* Today's Schedule */}
      {todaySchedule && todaySchedule.sessions.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1px solid #bbf7d0',
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#166534', marginBottom: 12 }}>
            📌 Today's Schedule
          </div>
          {todaySchedule.sessions.map((session, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 0',
              borderBottom: i < todaySchedule.sessions.length - 1 ? '1px solid #bbf7d0' : 'none',
            }}>
              <div style={{
                padding: '4px 8px',
                background: '#22c55e',
                color: '#fff',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
              }}>
                {session.startTime}
              </div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{session.course.title}</div>
              <div style={{ fontSize: 12, color: '#166534' }}>{session.duration} min</div>
            </div>
          ))}
        </div>
      )}

      {/* Week View */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Weekly Overview</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
          {DAYS.map(day => {
            const dayPlan = plan.find(p => p.day === day);
            const isToday = day === DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
            const isSelected = day === selectedDay;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                style={{
                  minWidth: 70,
                  padding: '10px 8px',
                  border: isSelected ? '2px solid #22c55e' : '1px solid var(--border)',
                  borderRadius: 10,
                  background: isSelected ? '#f0fdf4' : 'var(--bg)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: isToday ? '#22c55e' : 'var(--text-secondary)',
                  textTransform: 'uppercase',
                }}>
                  {day.slice(0, 3)}
                </div>
                <div style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: 'var(--text)',
                  marginTop: 4,
                }}>
                  {dayPlan?.sessions.length || 0}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>sessions</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDayPlan && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{selectedDay}</div>
          {selectedDayPlan.sessions.length === 0 ? (
            <div style={{
              padding: 20,
              background: 'var(--bg)',
              borderRadius: 10,
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}>
              🎉 Rest day - No sessions scheduled
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedDayPlan.sessions.map((session, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: 14,
                  background: 'var(--bg)',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 50,
                    height: 50,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                  }}>
                    {session.startTime}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{session.course.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {session.duration} minutes • {session.type === 'study' ? '📚 New Material' : '🔄 Review'}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    background: session.type === 'study' ? '#dbeafe' : '#dcfce7',
                    color: session.type === 'study' ? '#1d4ed8' : '#16a34a',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                  }}>
                    {session.type === 'study' ? 'STUDY' : 'REVIEW'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Study Tips */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>💡 Study Tips</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tips.map((tip, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              background: 'var(--bg)',
              borderRadius: 8,
              fontSize: 13,
            }}>
              <span style={{ fontSize: 16 }}>{tip.icon}</span>
              <span>{tip.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
