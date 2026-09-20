import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const COMMANDS = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', path: '/dashboard', category: 'Navigation' },
  { id: 'courses', label: 'My Courses', icon: '📚', path: '/courses', category: 'Navigation' },
  { id: 'quizzes', label: 'Quizzes', icon: '❓', path: '/quizzes', category: 'Navigation' },
  { id: 'assignments', label: 'Assignments', icon: '📝', path: '/assignments', category: 'Navigation' },
  { id: 'exams', label: 'Exams', icon: '🎓', path: '/exams', category: 'Navigation' },
  { id: 'progress', label: 'Progress', icon: '📊', path: '/progress', category: 'Navigation' },
  { id: 'certificates', label: 'Certificates', icon: '🏆', path: '/certificates', category: 'Navigation' },
  { id: 'discussions', label: 'Community', icon: '👥', path: '/discussions', category: 'Navigation' },
  { id: 'notifications', label: 'Calendar', icon: '📅', path: '/notifications', category: 'Navigation' },
  { id: 'profile', label: 'Profile', icon: '👤', path: '/profile', category: 'Navigation' },
  { id: 'settings', label: 'Settings', icon: '⚙️', path: '/settings', category: 'Navigation' },
  { id: 'campus-tour', label: '3D Campus Tour', icon: '🏫', path: '/campus-tour', category: '3D Features' },
  { id: '3d-stats', label: '3D Stats', icon: '📊', path: '/3d-stats', category: '3D Features' },
  { id: '3d-badges', label: '3D Badges', icon: '🏆', path: '/3d-badges', category: '3D Features' },
  { id: '3d-courses', label: '3D Courses', icon: '📚', path: '/3d-courses', category: '3D Features' },
  { id: '3d-classroom', label: '3D Classroom', icon: '🏫', path: '/3d-classroom', category: '3D Features' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: '🤖', path: '/ai-assistant', category: 'AI' },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const filteredCommands = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      navigate(filteredCommands[selectedIndex].path);
      setIsOpen(false);
    }
  }

  function handleSelect(path) {
    navigate(path);
    setIsOpen(false);
  }

  // Group by category
  const grouped = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '15vh',
    }}>
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={() => setIsOpen(false)}
      />

      {/* Palette */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 520,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        margin: '0 16px',
      }}>
        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 20, opacity: 0.5 }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 16,
              color: 'var(--text)',
            }}
          />
          <kbd style={{
            padding: '4px 8px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 12,
            color: 'var(--text-muted)',
          }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div style={{
          maxHeight: 360,
          overflowY: 'auto',
          padding: '8px',
        }}>
          {filteredCommands.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}>
              No results found
            </div>
          ) : (
            Object.entries(grouped).map(([category, commands]) => (
              <div key={category}>
                <div style={{
                  padding: '8px 12px 4px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {category}
                </div>
                {commands.map(cmd => {
                  const idx = filteredCommands.indexOf(cmd);
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => handleSelect(cmd.path)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        width: '100%',
                        padding: '10px 12px',
                        border: 'none',
                        borderRadius: 10,
                        background: idx === selectedIndex ? 'var(--primary-light)' : 'transparent',
                        color: 'var(--text)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 14,
                        fontWeight: 500,
                        transition: 'background 0.1s',
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{cmd.icon}</span>
                      <span style={{ flex: 1 }}>{cmd.label}</span>
                      <span style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                      }}>
                        →
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: 16,
          fontSize: 12,
          color: 'var(--text-muted)',
        }}>
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}
