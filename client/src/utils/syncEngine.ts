import { clearSyncQueue, getSyncQueue } from "@/utils/db";

export class SyncEngine {
  private syncing = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    setInterval(() => this.sync(), 30_000);
    window.addEventListener("online", () => this.sync());
  }

  notifyDirty() {
    if (this.debounceTimer) return;

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.sync();
    }, 100);
  }

  /**
   * Flushes the sync queue to the backend.
   */
  async sync(): Promise<boolean> {
    if (this.syncing) return false;

    this.syncing = true;
    try {
      const queue = await getSyncQueue();
      console.log("[syncEngine]: syncing queue", queue);
      if (queue.length === 0) return true;

      const res = await fetch("http://localhost:3000/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(queue)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await clearSyncQueue();
      return true;
    } catch (err) {
      console.error("[syncEngine] Sync failed", err);
      return false;
    } finally {
      this.syncing = false;
    }
  }
}

export const syncEngine = new SyncEngine();