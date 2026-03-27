package store

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type DB struct {
	*sql.DB
}

func Open(path string) (*DB, error) {
	db, err := sql.Open("sqlite3", path+"?_journal_mode=WAL&_busy_timeout=5000&_foreign_keys=on")
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	db.SetMaxOpenConns(1)
	db.SetConnMaxLifetime(0)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}
	return &DB{db}, nil
}

func (db *DB) Migrate() error {
	_, err := db.Exec(schema)
	if err != nil {
		return fmt.Errorf("migrate: %w", err)
	}
	return nil
}

const schema = `
CREATE TABLE IF NOT EXISTS users (
	id            INTEGER PRIMARY KEY AUTOINCREMENT,
	username      TEXT    NOT NULL UNIQUE,
	xp            INTEGER NOT NULL DEFAULT 0,
	level         INTEGER NOT NULL DEFAULT 1,
	streak_days   INTEGER NOT NULL DEFAULT 0,
	streak_last_date TEXT NOT NULL DEFAULT '',
	created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
	id           INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id      INTEGER NOT NULL REFERENCES users(id),
	title        TEXT    NOT NULL,
	category     TEXT    NOT NULL DEFAULT 'info',
	priority     INTEGER NOT NULL DEFAULT 5,
	complexity   INTEGER NOT NULL DEFAULT 1,
	status       TEXT    NOT NULL DEFAULT 'pending',
	created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
	completed_at TEXT
);

CREATE TABLE IF NOT EXISTS gummies (
	id           INTEGER PRIMARY KEY AUTOINCREMENT,
	task_id      INTEGER NOT NULL REFERENCES tasks(id),
	color        TEXT    NOT NULL,
	size         REAL    NOT NULL DEFAULT 1.0,
	orbit_radius REAL    NOT NULL DEFAULT 150.0,
	orbit_speed  REAL    NOT NULL DEFAULT 10000.0,
	status       TEXT    NOT NULL DEFAULT 'orbiting',
	created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS achievements (
	id          INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id     INTEGER NOT NULL REFERENCES users(id),
	name        TEXT    NOT NULL,
	unlocked_at TEXT    NOT NULL DEFAULT (datetime('now')),
	UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_gummies_task_id ON gummies(task_id);
CREATE INDEX IF NOT EXISTS idx_gummies_status ON gummies(status);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
`

// User represents a user in the system.
type User struct {
	ID             int64  `json:"id"`
	Username       string `json:"username"`
	XP             int    `json:"xp"`
	Level          int    `json:"level"`
	StreakDays     int    `json:"streakDays"`
	StreakLastDate string `json:"streakLastDate"`
	CreatedAt      string `json:"createdAt"`
}

// Task represents a task to be executed.
type Task struct {
	ID          int64  `json:"id"`
	UserID      int64  `json:"userId"`
	Title       string `json:"title"`
	Category    string `json:"category"`
	Priority    int    `json:"priority"`
	Complexity  int    `json:"complexity"`
	Status      string `json:"status"`
	CreatedAt   string `json:"createdAt"`
	CompletedAt string `json:"completedAt,omitempty"`
}

// Gummy represents a visual task bubble.
type Gummy struct {
	ID          int64   `json:"id"`
	TaskID      int64   `json:"taskId"`
	Color       string  `json:"color"`
	Size        float64 `json:"size"`
	OrbitRadius float64 `json:"orbitRadius"`
	OrbitSpeed  float64 `json:"orbitSpeed"`
	Status      string  `json:"status"`
	CreatedAt   string  `json:"createdAt"`
}

// Achievement represents an unlocked achievement.
type Achievement struct {
	ID         int64  `json:"id"`
	UserID     int64  `json:"userId"`
	Name       string `json:"name"`
	UnlockedAt string `json:"unlockedAt"`
}

// CreateUser inserts a new user.
func (db *DB) CreateUser(username string) (*User, error) {
	res, err := db.Exec("INSERT INTO users (username) VALUES (?)", username)
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	id, _ := res.LastInsertId()
	return &User{
		ID:        id,
		Username:  username,
		XP:        0,
		Level:     1,
		CreatedAt: time.Now().UTC().Format(time.DateTime),
	}, nil
}

// GetUser retrieves a user by ID.
func (db *DB) GetUser(id int64) (*User, error) {
	u := &User{}
	err := db.QueryRow(
		"SELECT id, username, xp, level, streak_days, streak_last_date, created_at FROM users WHERE id = ?", id,
	).Scan(&u.ID, &u.Username, &u.XP, &u.Level, &u.StreakDays, &u.StreakLastDate, &u.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}
	return u, nil
}

// UpdateUserXP updates user XP and level.
func (db *DB) UpdateUserXP(id int64, xp int, level int) error {
	_, err := db.Exec("UPDATE users SET xp = ?, level = ? WHERE id = ?", xp, level, id)
	if err != nil {
		return fmt.Errorf("update user xp: %w", err)
	}
	return nil
}

// UpdateUserStreak updates the user's streak.
func (db *DB) UpdateUserStreak(id int64, days int, lastDate string) error {
	_, err := db.Exec("UPDATE users SET streak_days = ?, streak_last_date = ? WHERE id = ?", days, lastDate, id)
	if err != nil {
		return fmt.Errorf("update user streak: %w", err)
	}
	return nil
}

// CreateTask inserts a new task.
func (db *DB) CreateTask(t *Task) error {
	res, err := db.Exec(
		"INSERT INTO tasks (user_id, title, category, priority, complexity, status) VALUES (?, ?, ?, ?, ?, ?)",
		t.UserID, t.Title, t.Category, t.Priority, t.Complexity, t.Status,
	)
	if err != nil {
		return fmt.Errorf("create task: %w", err)
	}
	t.ID, _ = res.LastInsertId()
	return nil
}

// GetTasksByUser returns all tasks for a user.
func (db *DB) GetTasksByUser(userID int64) ([]Task, error) {
	rows, err := db.Query(
		"SELECT id, user_id, title, category, priority, complexity, status, created_at, COALESCE(completed_at, '') FROM tasks WHERE user_id = ? ORDER BY priority DESC, created_at DESC", userID,
	)
	if err != nil {
		return nil, fmt.Errorf("get tasks: %w", err)
	}
	defer rows.Close()

	var tasks []Task
	for rows.Next() {
		var t Task
		if err := rows.Scan(&t.ID, &t.UserID, &t.Title, &t.Category, &t.Priority, &t.Complexity, &t.Status, &t.CreatedAt, &t.CompletedAt); err != nil {
			return nil, fmt.Errorf("scan task: %w", err)
		}
		tasks = append(tasks, t)
	}
	return tasks, rows.Err()
}

// CompleteTask marks a task as completed.
func (db *DB) CompleteTask(id int64) error {
	_, err := db.Exec(
		"UPDATE tasks SET status = 'completed', completed_at = datetime('now') WHERE id = ?", id,
	)
	if err != nil {
		return fmt.Errorf("complete task: %w", err)
	}
	return nil
}

// CreateGummy inserts a new gummy.
func (db *DB) CreateGummy(g *Gummy) error {
	res, err := db.Exec(
		"INSERT INTO gummies (task_id, color, size, orbit_radius, orbit_speed, status) VALUES (?, ?, ?, ?, ?, ?)",
		g.TaskID, g.Color, g.Size, g.OrbitRadius, g.OrbitSpeed, g.Status,
	)
	if err != nil {
		return fmt.Errorf("create gummy: %w", err)
	}
	g.ID, _ = res.LastInsertId()
	return nil
}

// GetActiveGummies returns all orbiting gummies.
func (db *DB) GetActiveGummies() ([]Gummy, error) {
	rows, err := db.Query(
		"SELECT id, task_id, color, size, orbit_radius, orbit_speed, status, created_at FROM gummies WHERE status = 'orbiting' ORDER BY created_at DESC",
	)
	if err != nil {
		return nil, fmt.Errorf("get active gummies: %w", err)
	}
	defer rows.Close()

	var gummies []Gummy
	for rows.Next() {
		var g Gummy
		if err := rows.Scan(&g.ID, &g.TaskID, &g.Color, &g.Size, &g.OrbitRadius, &g.OrbitSpeed, &g.Status, &g.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan gummy: %w", err)
		}
		gummies = append(gummies, g)
	}
	return gummies, rows.Err()
}

// UpdateGummyStatus updates a gummy's status.
func (db *DB) UpdateGummyStatus(id int64, status string) error {
	_, err := db.Exec("UPDATE gummies SET status = ? WHERE id = ?", status, id)
	if err != nil {
		return fmt.Errorf("update gummy status: %w", err)
	}
	return nil
}

// CreateAchievement inserts a new achievement.
func (db *DB) CreateAchievement(userID int64, name string) error {
	_, err := db.Exec("INSERT OR IGNORE INTO achievements (user_id, name) VALUES (?, ?)", userID, name)
	if err != nil {
		return fmt.Errorf("create achievement: %w", err)
	}
	return nil
}

// HasAchievement checks if a user has a specific achievement.
func (db *DB) HasAchievement(userID int64, name string) bool {
	var count int
	db.QueryRow("SELECT COUNT(*) FROM achievements WHERE user_id = ? AND name = ?", userID, name).Scan(&count)
	return count > 0
}

// GetAchievementSet returns a set of achievement names for a user.
func (db *DB) GetAchievementSet(userID int64) (map[string]bool, error) {
	rows, err := db.Query("SELECT name FROM achievements WHERE user_id = ?", userID)
	if err != nil {
		return nil, fmt.Errorf("get achievement set: %w", err)
	}
	defer rows.Close()

	set := make(map[string]bool)
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, fmt.Errorf("scan achievement name: %w", err)
		}
		set[name] = true
	}
	return set, rows.Err()
}

// CountExecutedGummies returns the total number of executed gummies.
func (db *DB) CountExecutedGummies() (int, error) {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM gummies WHERE status = 'executed'").Scan(&count)
	return count, err
}

// CountActiveGummies returns the number of orbiting gummies.
func (db *DB) CountActiveGummies() (int, error) {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM gummies WHERE status = 'orbiting'").Scan(&count)
	return count, err
}

// GetAchievements returns all achievements for a user.
func (db *DB) GetAchievements(userID int64) ([]Achievement, error) {
	rows, err := db.Query(
		"SELECT id, user_id, name, unlocked_at FROM achievements WHERE user_id = ? ORDER BY unlocked_at DESC", userID,
	)
	if err != nil {
		return nil, fmt.Errorf("get achievements: %w", err)
	}
	defer rows.Close()

	var achievements []Achievement
	for rows.Next() {
		var a Achievement
		if err := rows.Scan(&a.ID, &a.UserID, &a.Name, &a.UnlockedAt); err != nil {
			return nil, fmt.Errorf("scan achievement: %w", err)
		}
		achievements = append(achievements, a)
	}
	return achievements, rows.Err()
}
