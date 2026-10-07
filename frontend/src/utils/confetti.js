import confetti from 'canvas-confetti';

export function celebratePass() {
  // Fire confetti from both sides
  const duration = 3000;
  const end = Date.now() + duration;

  const colors = ['#22c55e', '#3b82f6', '#fbbf24', '#a78bfa', '#f87171'];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

export function celebrateAchievement() {
  // Burst from center
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#22c55e', '#3b82f6', '#fbbf24', '#a78bfa'],
  });
}

export function celebrateStreak(streak) {
  // Custom amount based on streak
  const count = Math.min(streak * 10, 100);
  confetti({
    particleCount: count,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#f97316', '#eab308', '#ef4444'],
  });
}
