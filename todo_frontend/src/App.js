import React, { useState, useEffect } from 'react';
import './App.css';

// API base for the local express server
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';

// PUBLIC_INTERFACE
function App() {
  /**
   * Retro-themed Todo App UI
   * - Add, list, delete tasks
   * - Uses minimal Express/SQLite API
   */

  const [theme] = useState('light'); // fixed light theme per style guide
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Apply theme to root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load tasks on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE}/api/tasks`);
        if (!res.ok) throw new Error('Failed to load tasks');
        const data = await res.json();
        if (!cancelled) setTasks(data);
      } catch (e) {
        if (!cancelled) setError('Unable to load tasks. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Please enter a task title.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add task');
      }
      const created = await res.json();
      setTasks(prev => [created, ...prev]);
      setTitle('');
    } catch (e) {
      setError(e.message || 'Failed to add task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete task');
      }
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      setError(e.message || 'Failed to delete task.');
    }
  };

  return (
    <div className="App retro-bg">
      <header className="retro-header">
        <h1 className="retro-title">★ TODO MATRIX ★</h1>
        <p className="retro-subtitle">Type a task and press Add</p>
      </header>

      <main className="container">
        <form className="input-row" onSubmit={handleAdd}>
          <input
            aria-label="Task title"
            className="retro-input"
            type="text"
            placeholder="> Enter your task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
          />
          <button className="retro-btn" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Add'}
          </button>
        </form>

        {error && <div className="retro-alert" role="alert">⛔ {error}</div>}

        {loading ? (
          <div className="retro-card muted">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="retro-card muted">No tasks yet. Add your first task above.</div>
        ) : (
          <ul className="task-list">
            {tasks.map(task => (
              <li key={task.id} className="task-item retro-card">
                <div className="task-main">
                  <span className="task-bullet">▣</span>
                  <span className="task-title">{task.title}</span>
                </div>
                <button
                  className="retro-btn danger"
                  onClick={() => handleDelete(task.id)}
                  aria-label={`Delete task ${task.title}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="retro-footer">
        <span>v0.1 • React + SQLite</span>
      </footer>
    </div>
  );
}

export default App;
