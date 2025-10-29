'use strict';

/**
 * Minimal Express API for Todo tasks with SQLite persistence.
 * Endpoints:
 *  - GET /api/health
 *  - GET /api/tasks
 *  - POST /api/tasks { title }
 *  - DELETE /api/tasks/:id
 *
 * Notes:
 * - Uses a local SQLite file (./data/todo.db) for persistence.
 * - CORS enabled for local development.
 * - Creates the tasks table automatically if it doesn't exist.
 */

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

// Configuration via env (should be provided by orchestrator in .env)
const PORT = process.env.API_PORT ? Number(process.env.API_PORT) : 3001;
// Use local file for persistence; if a remote SQLite URL is provided in env in future,
// you can update this to use that. Keeping simple and persistent in workspace.
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'todo.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Create Express app
const app = express();
app.use(cors()); // Allow all origins for simplicity in preview
app.use(express.json());

// Initialize SQLite database connection
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database:', DB_FILE);
  }
});

// Initialize schema
const initSQL = `
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

db.serialize(() => {
  db.run(initSQL, (err) => {
    if (err) {
      console.error('Failed to initialize DB schema:', err.message);
    } else {
      console.log('SQLite schema ensured.');
    }
  });
});

// PUBLIC_INTERFACE
app.get('/api/health', (req, res) => {
  /** Simple health endpoint to verify server is running. */
  res.json({ status: 'ok' });
});

// PUBLIC_INTERFACE
app.get('/api/tasks', (req, res) => {
  /** List all tasks ordered by newest first */
  const sql = 'SELECT id, title, created_at FROM tasks ORDER BY id DESC';
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching tasks:', err.message);
      return res.status(500).json({ error: 'Failed to fetch tasks' });
    }
    return res.json(rows);
  });
});

// PUBLIC_INTERFACE
app.post('/api/tasks', (req, res) => {
  /**
   * Create a task
   * Body: { title: string }
   */
  const { title } = req.body || {};
  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const trimmed = String(title).trim();
  const sql = 'INSERT INTO tasks (title) VALUES (?)';
  db.run(sql, [trimmed], function (err) {
    if (err) {
      console.error('Error inserting task:', err.message);
      return res.status(500).json({ error: 'Failed to add task' });
    }
    // Return the created task with id
    const selectSql = 'SELECT id, title, created_at FROM tasks WHERE id = ?';
    db.get(selectSql, [this.lastID], (getErr, row) => {
      if (getErr) {
        console.error('Error retrieving created task:', getErr.message);
        return res.status(201).json({ id: this.lastID, title: trimmed });
      }
      return res.status(201).json(row);
    });
  });
});

// PUBLIC_INTERFACE
app.delete('/api/tasks/:id', (req, res) => {
  /** Delete a task by ID */
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid task id' });
  }
  const sql = 'DELETE FROM tasks WHERE id = ?';
  db.run(sql, [id], function (err) {
    if (err) {
      console.error('Error deleting task:', err.message);
      return res.status(500).json({ error: 'Failed to delete task' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    return res.json({ success: true });
  });
});

// Start server only if run directly (not required by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Todo API server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
