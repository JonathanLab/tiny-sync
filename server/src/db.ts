import { Task } from "@/schema";
import Database from "better-sqlite3";

const db = new Database("tiny-sync.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    deleted INTEGER NOT NULL
  )
`);

const upsertTask = db.prepare(`
  INSERT INTO tasks (id, title, completed, updatedAt, deleted)
  VALUES (@id, @title, @completed, @updatedAt, @deleted)
  ON CONFLICT(id) DO UPDATE SET
    title = @title,
    completed = @completed,
    updatedAt = @updatedAt,
    deleted = @deleted
`);

const getAllTasks = db.prepare(`SELECT * FROM tasks`);

const deleteTaskStmt = db.prepare(`DELETE FROM tasks WHERE id = ?`);

export function saveTask(task: Task) {
  upsertTask.run({
    ...task,
    completed: task.completed ? 1 : 0, // SQLite doesn't have booleans :(
    deleted: task.deleted ? 1 : 0
  });
}

export function getTasks(): Task[] {
  return getAllTasks.all().map((row: any) => ({
    ...row,
    completed: !!row.completed,
    deleted: !!row.deleted
  }));
}

export function deleteTask(id: string) {
  deleteTaskStmt.run(id);
}

export default db;
