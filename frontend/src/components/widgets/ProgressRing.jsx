import React, { useEffect, useState } from 'react';

export function ProgressRing({
  progress = 0,
  size = 120,
  strokeWidth = 10,
  color = '#22c55e',
  bgColor = '#e2e8f0',
  showLabel = true,
  label = '',
  animate = true,
}) {
  const [currentProgress, setCurrentProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (currentProgress / 100) * circumference;

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setCurrentProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setCurrentProgress(progress);
    }
  }, [progress, animate]);

  const getStrokeColor = () => {
    if (progress >= 80) return '#22c55e';
    if (progress >= 50) return '#3b82f6';
    if (progress >= 25) return '#f59e0b';
    return '#ef4444';
  };

  const finalColor = color === '#22c55e' ? getStrokeColor() : color;

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={finalColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: animate ? 'stroke-dashoffset 1s ease-out' : 'none',
            filter: `drop-shadow(0 0 6px ${finalColor}40)`,
          }}
        />
      </svg>
      {showLabel && (
        <div style={{
          position: 'absolute',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: size * 0.22,
            fontWeight: 900,
            color: 'var(--text)',
            lineHeight: 1,
          }}>
            {Math.round(currentProgress)}%
          </div>
          {label && (
            <div style={{
              fontSize: size * 0.1,
              color: 'var(--text-secondary)',
              fontWeight: 600,
              marginTop: 4,
            }}>
              {label}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CourseProgressRing({ progress, courseTitle, size = 100 }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    }}>
      <ProgressRing progress={progress} size={size} />
      {courseTitle && (
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textAlign: 'center',
          maxWidth: size + 20,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {courseTitle}
        </div>
      )}
    </div>
  );
}

export function DashboardProgressRings({ courses = [] }) {
  const totalProgress = courses.length > 0
    ? Math.round(courses.reduce((acc, c) => acc + (c.progress || 0), 0) / courses.length)
    : 0;

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 24,
      justifyContent: 'center',
      padding: '20px 0',
    }}>
      <div style={{ textAlign: 'center' }}>
        <ProgressRing
          progress={totalProgress}
          size={140}
          strokeWidth={12}
          label="Overall"
        />
      </div>
      {courses.slice(0, 4).map((course, i) => (
        <div key={course.id || i} style={{ textAlign: 'center' }}>
          <CourseProgressRing
            progress={course.progress || 0}
            courseTitle={course.title}
            size={100}
          />
        </div>
      ))}
    </div>
  );
}
