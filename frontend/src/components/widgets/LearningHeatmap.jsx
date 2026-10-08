import React, { useState, useEffect } from 'react';

const ACTIVITY_KEY = 'lms_learning_activity';

function getActivityData() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveActivityData(data) {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(data));
}

export function trackActivity(type = 'study', minutes = 0) {
  const data = getActivityData();
  const today = new Date().toISOString().split('T')[0];
  
  if (!data[today]) {
    data[today] = { count: 0, minutes: 0, types: [] };
  }
  
  data[today].count += 1;
  data[today].minutes += minutes;
  if (!data[today].types.includes(type)) {
    data[today].types.push(type);
  }
  
  saveActivityData(data);
}

function getDayClass(count) {
  if (count === 0) return 'activity-empty';
  if (count <= 1) return 'activity-low';
  if (count <= 3) return 'activity-medium';
  if (count <= 5) return 'activity-high';
  return 'activity-max';
}

export function LearningHeatmap({ compact = false }) {
  const [activityData, setActivityData] = useState({});
  const [hoveredDay, setHoveredDay] = useState(null);

  useEffect(() => {
    setActivityData(getActivityData());
  }, []);

  // Generate last 365 days
  const today = new Date();
  const weeks = [];
  let currentDate = new Date(today);
  currentDate.setDate(currentDate.getDate() - 364);
  
  // Align to start of week (Monday)
  while (currentDate.getDay() !== 1) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  for (let week = 0; week < 52; week++) {
    const weekDays = [];
    for (let day = 0; day < 7; day++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const activity = activityData[dateStr] || { count: 0, minutes: 0 };
      weekDays.push({
        date: dateStr,
        dayOfWeek: day,
        count: activity.count,
        minutes: activity.minutes,
        isToday: dateStr === today.toISOString().split('T')[0],
        isFuture: currentDate > today,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(weekDays);
  }

  // Calculate stats
  const totalDays = Object.keys(activityData).length;
  const totalMinutes = Object.values(activityData).reduce((acc, d) => acc + (d.minutes || 0), 0);
  const currentStreak = calculateStreak(activityData);
  const longestStreak = calculateLongestStreak(activityData);

  // Get last 4 weeks for monthly view
  const last4Weeks = weeks.slice(-4);
  const monthlyMinutes = last4Weeks.flat().reduce((acc, d) => acc + d.minutes, 0);

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', ''];
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (compact) {
    return (
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>📅</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Learning Activity</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {totalDays} active days
            </div>
          </div>
        </div>
        
        {/* Mini heatmap */}
        <div style={{ 
          display: 'flex', 
          gap: 2, 
          overflowX: 'auto',
          padding: '4px 0',
        }}>
          {weeks.slice(-12).map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {week.map((day, di) => (
                <div
                  key={di}
                  title={`${day.date}: ${day.count} activities, ${day.minutes} min`}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: day.isFuture ? 'transparent' : getDayColor(day.count),
                    border: day.isToday ? '1px solid var(--primary)' : 'none',
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        <style>{`
          .activity-empty { background: var(--bg-muted); }
          .activity-low { background: #86efac; }
          .activity-medium { background: #22c55e; }
          .activity-high { background: #16a34a; }
          .activity-max { background: #15803d; }
        `}</style>
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
        justifyContent: 'space-between',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
          }}>
            📊
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Learning Activity</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              Your study activity over the past year
            </p>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ color: 'var(--text-muted)' }}>Less</span>
          {[0, 1, 3, 5, 8].map(count => (
            <div
              key={count}
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: getDayColor(count),
              }}
            />
          ))}
          <span style={{ color: 'var(--text-muted)' }}>More</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}>
        <StatCard icon="🔥" label="Current Streak" value={`${currentStreak} days`} />
        <StatCard icon="🏆" label="Longest Streak" value={`${longestStreak} days`} />
        <StatCard icon="📅" label="Active Days" value={totalDays} />
        <StatCard icon="⏱️" label="Total Time" value={formatTime(totalMinutes)} />
        <StatCard icon="📈" label="This Month" value={formatTime(monthlyMinutes)} />
      </div>

      {/* Heatmap */}
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        {/* Month labels */}
        <div style={{ display: 'flex', marginLeft: 30, marginBottom: 4 }}>
          {monthLabels.map((month, i) => (
            <div key={i} style={{
              width: `${100 / 12}%`,
              fontSize: 11,
              color: 'var(--text-muted)',
              textAlign: 'left',
            }}>
              {month}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {/* Day labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {dayLabels.map((label, i) => (
              <div key={i} style={{
                width: 24,
                height: 12,
                fontSize: 10,
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}>
                {label}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div style={{ display: 'flex', gap: 3 }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      background: day.isFuture ? 'transparent' : getDayColor(day.count),
                      border: day.isToday ? '2px solid var(--primary)' : '1px solid transparent',
                      cursor: day.isFuture ? 'default' : 'pointer',
                      transition: 'transform 0.1s',
                      transform: hoveredDay?.date === day.date ? 'scale(1.3)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredDay && !hoveredDay.isFuture && (
        <div style={{
          marginTop: 12,
          padding: '8px 12px',
          background: 'var(--bg)',
          borderRadius: 8,
          fontSize: 12,
          display: 'inline-block',
        }}>
          <strong>{hoveredDay.date}</strong>: {hoveredDay.count} activities, {hoveredDay.minutes} minutes
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div style={{
      padding: 14,
      background: 'var(--bg)',
      borderRadius: 10,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function getDayColor(count) {
  if (count === 0) return '#e2e8f0';
  if (count <= 1) return '#86efac';
  if (count <= 3) return '#22c55e';
  if (count <= 5) return '#16a34a';
  return '#15803d';
}

function formatTime(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function calculateStreak(data) {
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    if (data[dateStr] && data[dateStr].count > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  
  return streak;
}

function calculateLongestStreak(data) {
  let longest = 0;
  let current = 0;
  const dates = Object.keys(data).sort();
  
  for (let i = 0; i < dates.length; i++) {
    if (data[dates[i]].count > 0) {
      if (i === 0) {
        current = 1;
      } else {
        const prevDate = new Date(dates[i - 1]);
        const currDate = new Date(dates[i]);
        const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          current++;
        } else {
          current = 1;
        }
      }
      longest = Math.max(longest, current);
    }
  }
  
  return longest;
}
