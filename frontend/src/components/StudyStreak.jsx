import React, { useState, useEffect } from 'react';

const STREAK_KEY = 'lms_study_streak';

function getStreakData() {
  try {
    const data = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}');
    return {
      count: data.count || 0,
      lastDate: data.lastDate || null,
    };
  } catch {
    return { count: 0, lastDate: null };
  }
}

function saveStreakData(data) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
}

function isYesterday(dateStr) {
  if (!dateStr) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === yesterday.toISOString().split('T')[0];
}

export function useStudyStreak() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const data = getStreakData();
    const today = new Date().toISOString().split('T')[0];

    if (isToday(data.lastDate)) {
      // Already logged in today
      setStreak(data.count);
    } else if (isYesterday(data.lastDate)) {
      // Consecutive day - increment streak
      const newCount = data.count + 1;
      setStreak(newCount);
      saveStreakData({ count: newCount, lastDate: today });
    } else if (data.lastDate) {
      // Streak broken - reset to 1
      setStreak(1);
      saveStreakData({ count: 1, lastDate: today });
    } else {
      // First time
      setStreak(1);
      saveStreakData({ count: 1, lastDate: today });
    }
  }, []);

  return streak;
}

export function StudyStreakBadge({ streak }) {
  if (!streak || streak < 1) return null;

  const getFireSize = () => {
    if (streak >= 30) return 28;
    if (streak >= 14) return 24;
    if (streak >= 7) return 20;
    return 16;
  };

  const getStreakColor = () => {
    if (streak >= 30) return 'linear-gradient(135deg, #ef4444, #f97316)';
    if (streak >= 14) return 'linear-gradient(135deg, #f97316, #eab308)';
    if (streak >= 7) return 'linear-gradient(135deg, #eab308, #84cc16)';
    return 'linear-gradient(135deg, #64748b, #94a3b8)';
  };

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: getStreakColor(),
      padding: '6px 12px',
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 700,
      color: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    }}>
      <span style={{ fontSize: getFireSize() }}>
        {streak >= 30 ? '🔥' : streak >= 7 ? '🔥' : '🔥'}
      </span>
      <span>{streak} day streak</span>
    </div>
  );
}

export function StudyStreakCard({ streak }) {
  const getFlameAnimation = () => {
    if (streak >= 7) return 'pulse 1s infinite';
    return 'none';
  };

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: 20,
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: 48,
        animation: getFlameAnimation(),
        marginBottom: 8,
      }}>
        🔥
      </div>
      <div style={{
        fontSize: 32,
        fontWeight: 900,
        color: 'var(--text)',
        letterSpacing: '-0.02em',
      }}>
        {streak}
      </div>
      <div style={{
        fontSize: 13,
        color: 'var(--text-secondary)',
        fontWeight: 600,
      }}>
        Day Study Streak
      </div>
      {streak >= 7 && (
        <div style={{
          marginTop: 12,
          padding: '6px 12px',
          background: '#fef3c7',
          color: '#92400e',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
        }}>
          🔥 On Fire! Keep it up!
        </div>
      )}
      {streak >= 30 && (
        <div style={{
          marginTop: 8,
          padding: '6px 12px',
          background: '#fee2e2',
          color: '#991b1b',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
        }}>
          🏆 Legendary Streak!
        </div>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
