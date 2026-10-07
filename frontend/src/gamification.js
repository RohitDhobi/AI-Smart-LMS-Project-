import { api } from './api';

const XP_KEY = 'lms_xp_data';
const ACHIEVEMENTS_KEY = 'lms_achievements';
const LEVELS_KEY = 'lms_levels';
const STREAK_KEY = 'lms_study_streak';
const FOCUS_KEY = 'lms_focus_minutes';
const LESSONS_KEY = 'lms_lessons_completed';

// XP requirements for each level
export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000,
  7000, 9500, 12500, 16000, 20000, 25000, 31000, 38000, 46000, 55000
];

// Achievement definitions
export const ACHIEVEMENTS = [
  { id: 'first-login', title: 'Welcome!', description: 'Logged in for the first time', icon: '👋', xp: 10, condition: 'login' },
  { id: 'first-quiz', title: 'Quiz Taker', description: 'Completed your first quiz', icon: '📝', xp: 25, condition: 'quiz' },
  { id: 'quiz-pass', title: 'Quiz Master', description: 'Passed a quiz', icon: '✅', xp: 50, condition: 'quiz-pass' },
  { id: 'quiz-perfect', title: 'Perfect Score', description: 'Got 100% on a quiz', icon: '💯', xp: 100, condition: 'quiz-perfect' },
  { id: 'first-lesson', title: 'Student', description: 'Completed your first lesson', icon: '📚', xp: 20, condition: 'lesson' },
  { id: 'lessons-10', title: 'Dedicated Learner', description: 'Completed 10 lessons', icon: '🎯', xp: 75, condition: 'lessons-10' },
  { id: 'lessons-50', title: 'Knowledge Seeker', description: 'Completed 50 lessons', icon: '🧠', xp: 200, condition: 'lessons-50' },
  { id: 'course-complete', title: 'Course Graduate', description: 'Completed a course', icon: '🎓', xp: 150, condition: 'course-complete' },
  { id: 'streak-3', title: 'On Fire', description: '3-day study streak', icon: '🔥', xp: 50, condition: 'streak-3' },
  { id: 'streak-7', title: 'Week Warrior', description: '7-day study streak', icon: '⚔️', xp: 100, condition: 'streak-7' },
  { id: 'streak-30', title: 'Unstoppable', description: '30-day study streak', icon: '💎', xp: 500, condition: 'streak-30' },
  { id: 'first-assignment', title: 'Assignment Starter', description: 'Submitted your first assignment', icon: '📋', xp: 30, condition: 'assignment' },
  { id: 'early-bird', title: 'Early Bird', description: 'Studied before 8 AM', icon: '🌅', xp: 25, condition: 'early-bird' },
  { id: 'night-owl', title: 'Night Owl', description: 'Studied after 10 PM', icon: '🦉', xp: 25, condition: 'night-owl' },
  { id: 'social-learner', title: 'Social Learner', description: 'Participated in discussions', icon: '💬', xp: 30, condition: 'discussion' },
  { id: 'explorer', title: 'Explorer', description: 'Visited all 3D features', icon: '🗺️', xp: 50, condition: 'explore' },
  { id: 'first-code-solved', title: 'Code Crusher', description: 'Solved your first coding challenge', icon: '💻', xp: 50, condition: 'code-solve' },
  { id: 'algo-master-5', title: 'Algorithm Adept', description: 'Solved 5 coding challenges', icon: '⚡', xp: 150, condition: 'code-5' },
  { id: 'coding-streak-3', title: 'Code Warrior', description: 'Submitted coding solutions across 3 days', icon: '🔥', xp: 100, condition: 'code-streak' },
  { id: 'perfect-submission', title: 'Clean Code Master', description: 'Passed all test cases with 100% score', icon: '✨', xp: 75, condition: 'code-perfect' },
];

// Helper functions
function getData(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return defaultValue;
    const data = JSON.parse(raw);
    if (typeof data === 'object' && data !== null && typeof defaultValue === 'object' && defaultValue !== null) {
      return { ...defaultValue, ...data };
    }
    return data;
  } catch {
    return defaultValue;
  }
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('saveData error:', e);
  }
}

// XP Functions
export function getXpData() {
  const data = getData(XP_KEY, { total: 0, history: [] });
  return { total: Number(data.total) || 0, history: Array.isArray(data.history) ? data.history : [] };
}

export function addXP(amount, reason = '') {
  const numAmount = Number(amount) || 0;
  const data = getXpData();
  data.total = (data.total || 0) + numAmount;
  data.history.push({
    amount: numAmount,
    reason,
    date: new Date().toISOString(),
  });
  // Keep only last 100 entries
  if (data.history.length > 100) {
    data.history = data.history.slice(-100);
  }
  saveData(XP_KEY, data);
  return data.total;
}

export function getTotalXP() {
  return getXpData().total;
}

export function getLevel() {
  const xp = getTotalXP();
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

export function getXPForNextLevel() {
  const level = getLevel();
  if (level >= LEVEL_THRESHOLDS.length) return 0;
  return LEVEL_THRESHOLDS[level];
}

export function getXPProgress() {
  const xp = getTotalXP();
  const level = getLevel();
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progress = ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.min(100, Math.max(0, progress));
}

// Focus Minutes Functions
export function getFocusMinutes() {
  try {
    return parseInt(localStorage.getItem(FOCUS_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function addFocusMinutes(mins) {
  try {
    const current = getFocusMinutes();
    const updated = current + (Number(mins) || 0);
    localStorage.setItem(FOCUS_KEY, String(updated));
    return updated;
  } catch {
    return 0;
  }
}

// Lessons Completed Functions
export function getLessonsCompleted() {
  try {
    return parseInt(localStorage.getItem(LESSONS_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function setLessonsCompleted(count) {
  try {
    localStorage.setItem(LESSONS_KEY, String(Number(count) || 0));
  } catch {}
}

export function addLessonsCompleted(delta = 1) {
  try {
    const current = getLessonsCompleted();
    const updated = current + (Number(delta) || 1);
    localStorage.setItem(LESSONS_KEY, String(updated));
    return updated;
  } catch {
    return 0;
  }
}

// Achievement Functions
export function getUnlockedAchievements() {
  const data = getData(ACHIEVEMENTS_KEY, { unlocked: [] });
  return { unlocked: Array.isArray(data.unlocked) ? data.unlocked : [] };
}

export function unlockAchievement(achievementId) {
  const data = getUnlockedAchievements();
  if (data.unlocked.includes(achievementId)) {
    return false; // Already unlocked
  }
  
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) return false;
  
  data.unlocked.push(achievementId);
  saveData(ACHIEVEMENTS_KEY, data);
  
  // Award XP
  if (achievement.xp > 0) {
    addXP(achievement.xp, `Achievement: ${achievement.title}`);
  }
  
  return achievement;
}

export function isAchievementUnlocked(achievementId) {
  const data = getUnlockedAchievements();
  return data.unlocked.includes(achievementId);
}

export function getUnlockedCount() {
  const data = getUnlockedAchievements();
  return data.unlocked.length;
}

export function getTotalAchievements() {
  return ACHIEVEMENTS.length;
}

// Activity tracking (called from existing gamification)
export function awardActivity(activity) {
  const { type, xp = 10, focusMinutes = 0, lessonsCompleted = 0 } = activity;
  
  // Award XP
  const earned = addXP(xp, type);

  if (type === 'focus' || focusMinutes > 0) {
    addFocusMinutes(focusMinutes || 25);
  }

  if (type === 'lesson' || type === 'lesson-complete' || lessonsCompleted > 0) {
    addLessonsCompleted(lessonsCompleted || 1);
  }
  
  // Check for achievement unlocks
  switch (type) {
    case 'login':
      unlockAchievement('first-login');
      break;
    case 'quiz':
    case 'quiz-pass':
      unlockAchievement('first-quiz');
      if (type === 'quiz-pass') unlockAchievement('quiz-pass');
      break;
    case 'quiz-perfect':
      unlockAchievement('quiz-perfect');
      break;
    case 'lesson':
    case 'lesson-complete':
      unlockAchievement('first-lesson');
      break;
    case 'assignment':
    case 'assignment-submit':
      unlockAchievement('first-assignment');
      break;
    case 'discussion':
    case 'post':
      unlockAchievement('social-learner');
      break;
    case 'code-solve':
      unlockAchievement('first-code-solved');
      break;
    case 'code-perfect':
      unlockAchievement('first-code-solved');
      unlockAchievement('perfect-submission');
      break;
  }
  
  // Time-based achievements
  const hour = new Date().getHours();
  if (hour < 8) unlockAchievement('early-bird');
  if (hour >= 22) unlockAchievement('night-owl');

  window.dispatchEvent(new Event('lms-gamification-update'));
  
  return earned;
}

// Stats
export function getGamificationStats() {
  return {
    xp: getTotalXP(),
    level: getLevel(),
    xpProgress: getXPProgress(),
    xpForNextLevel: getXPForNextLevel(),
    achievements: getUnlockedCount(),
    totalAchievements: getTotalAchievements(),
    streak: getStreak(),
    focusMinutes: getFocusMinutes(),
    lessonsCompleted: getLessonsCompleted(),
  };
}

function getStreak() {
  try {
    const data = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}');
    return data.count || 0;
  } catch {
    return 0;
  }
}

// Alias for compatibility
export const getGamification = getGamificationStats;

// Reconcile and synchronize with backend statistics
export async function syncGamificationWithBackend() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return getGamificationStats();

    const [codingRes, subjectsRes, quizAttemptsRes] = await Promise.allSettled([
      api.codingStats ? api.codingStats() : null,
      api.mySubjects ? api.mySubjects() : null,
      api.quizAttempts ? api.quizAttempts() : null,
    ]);

    let codingXp = 0;
    let codingSolved = 0;
    if (codingRes.status === 'fulfilled' && codingRes.value) {
      const stats = codingRes.value;
      codingXp = Number(stats.userTotalXp || 0);
      codingSolved = Number(stats.userSolved || 0);
    }

    let lessonsCount = 0;
    if (subjectsRes.status === 'fulfilled' && subjectsRes.value) {
      const courseData = subjectsRes.value;
      const subjects = courseData?.subjects || [];
      lessonsCount = subjects.reduce((sum, s) => {
        const comp = s.completedLessons != null ? s.completedLessons : (s.progressPercentage >= 100 ? (s.totalLessons || 1) : 0);
        return sum + comp;
      }, 0);
    }

    let quizPassCount = 0;
    let quizPerfectCount = 0;
    if (quizAttemptsRes.status === 'fulfilled' && Array.isArray(quizAttemptsRes.value)) {
      quizAttemptsRes.value.forEach(a => {
        const pct = a.percentage ?? a.score ?? 0;
        if (pct >= 60) quizPassCount++;
        if (pct >= 100) quizPerfectCount++;
      });
    }

    const currentXpData = getXpData();
    const backendXp = codingXp + (lessonsCount * 20) + (quizPassCount * 50);

    let updated = false;

    if (backendXp > currentXpData.total) {
      currentXpData.total = backendXp;
      if (codingXp > 0 && !currentXpData.history.some(h => h.reason === 'coding-backend')) {
        currentXpData.history.push({
          amount: codingXp,
          reason: 'coding-backend',
          date: new Date().toISOString()
        });
      }
      saveData(XP_KEY, currentXpData);
      updated = true;
    }

    if (lessonsCount > getLessonsCompleted()) {
      setLessonsCompleted(lessonsCount);
      updated = true;
    }

    if (codingSolved > 0) unlockAchievement('first-code-solved');
    if (codingSolved >= 5) unlockAchievement('algo-master-5');
    if (quizPassCount > 0) {
      unlockAchievement('first-quiz');
      unlockAchievement('quiz-pass');
    }
    if (quizPerfectCount > 0) unlockAchievement('quiz-perfect');
    if (lessonsCount > 0) unlockAchievement('first-lesson');
    if (lessonsCount >= 10) unlockAchievement('lessons-10');
    if (lessonsCount >= 50) unlockAchievement('lessons-50');

    if (updated) {
      window.dispatchEvent(new Event('lms-gamification-update'));
    }

    return getGamificationStats();
  } catch (err) {
    console.error('syncGamificationWithBackend error:', err);
    return getGamificationStats();
  }
}

// Weekly activity data
export function getWeeklyActivity() {
  const data = getXpData();
  const history = data.history || [];
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayXP = history
      .filter(h => h.date && h.date.startsWith(dateStr))
      .reduce((acc, h) => acc + (h.amount || 0), 0);
    
    daysData.push({
      day: days[date.getDay()],
      date: dateStr,
      xp: dayXP,
      label: days[date.getDay()],
      total: dayXP,
      lessons: dayXP > 0 ? 1 : 0,
      quizzes: 0,
    });
  }
  
  return {
    days: daysData,
    state: {
      xp: getTotalXP(),
      streak: getStreak(),
      focusMinutes: getFocusMinutes(),
      lessonsCompleted: getLessonsCompleted(),
    }
  };
}

// Get badges/achievements
export function getBadges() {
  return ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: isAchievementUnlocked(a.id),
  }));
}

// Theme functions
const THEME_KEY = 'lms_theme';

export function getTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
  } catch {
    // Ignore errors
  }
}

// Touch streak function
export function touchStreak() {
  try {
    const data = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}');
    const today = new Date().toISOString().split('T')[0];
    
    if (data.lastDate === today) {
      return data.count || 0;
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    let newCount;
    if (data.lastDate === yesterdayStr) {
      newCount = (data.count || 0) + 1;
    } else if (data.lastDate) {
      newCount = 1;
    } else {
      newCount = 1;
    }
    
    localStorage.setItem(STREAK_KEY, JSON.stringify({
      count: newCount,
      lastDate: today,
    }));
    
    return newCount;
  } catch {
    return 0;
  }
}

