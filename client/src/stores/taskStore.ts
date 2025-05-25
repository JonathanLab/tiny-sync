import { Task } from "@/types";
import { deleteTask, getTasks, queueTaskForSync, saveTask } from "@/utils/db";
import { syncEngine } from "@/utils/syncEngine";
import { connectWebSocket } from "@/utils/syncSocket";
import { get, makeAutoObservable, runInAction } from "mobx";

export class TaskStore {
  tasks = new Map<string, Task>();
  loading = true;

  constructor() {
    makeAutoObservable(this);
    this.init();
    connectWebSocket();
  }
  private async init() {
    const persistedTasks = await getTasks();
    // First bootstrap from IndexedDB
    runInAction(() => {
      for (const task of persistedTasks) {
        this.tasks.set(task.id, task);
      }
      this.loading = false;
    });

    // Then bootstrap from server
    try {
      const res = await fetch("/api/tasks");
      const serverTasks: Task[] = await res.json();

      const serverIds = new Set(serverTasks.map((t) => t.id));

      runInAction(() => {
        for (const task of serverTasks) {
          this.applyRemote(task);
        }

        // Remove local tasks that no longer exist on server
        // Even though we tombstone them, API responses aren't supposed to include them, so we can't filter by deleted.
        for (const [id] of this.tasks) {
          if (!serverIds.has(id)) {
            this.tasks.delete(id);
          }
        }
      });
    } catch (err) {
      console.error("Failed to pull from server", err);
    }
  }

  /**
   * Save a task locally (create or update) and queue it for sync.
   * @param data - The task data to save.
   * @returns The saved task.
   */
  async save(data: Partial<Task> & { id: string }): Promise<Task> {
    const now = Date.now();
    let task: Task;

    const taskExists = data.id && this.tasks.has(data.id);

    if (taskExists) {
        const existing = get(this.tasks, data.id);
        task = {
            ...existing,
            ...data,
            updatedAt: now,
        };
    } else {
        task = {
            id: data.id ?? crypto.randomUUID(),
            title: data.title || "",
            completed: data.completed ?? false,
            updatedAt: now,
        };
    }

    runInAction(() => {
        this.tasks.set(task.id, task);
    });

    await this.apply(task);

    return task;
  }

  async delete(id: string): Promise<void> {
    const existing = this.tasks.get(id);

    if (!existing) return;

    const tombstone = {
      ...existing,
      deleted: true,
      updatedAt: Date.now(),
    }

    runInAction(() => {
      this.tasks.delete(id);
    });

    await this.apply(tombstone);
  }

  private async apply(task: Task) {
    await saveTask(task);
    await queueTaskForSync(task);
    syncEngine.notifyDirty();
  }

  applyRemote(task: Task) {
    const existing = this.tasks.get(task.id);
    const shouldApply =
      !existing || task.updatedAt > existing.updatedAt;

    if (!shouldApply) return;

    if (task.deleted) {
      this.tasks.delete(task.id);
      deleteTask(task.id);
    } else {
      this.tasks.set(task.id, task);
      saveTask(task);
    }
  }

  get sortedTasks(): Task[] {
    return Array.from(this.tasks.values()).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );
  }
}

export const taskStore = new TaskStore();