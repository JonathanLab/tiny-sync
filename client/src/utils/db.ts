import { Task } from "@/types";

const DB_NAME = "tiny-sync-db"
const DB_VERSION = 1;

export const STORE = {
    TASKS: "tasks",
    SYNC_QUEUE: "syncQueue"
}

let dbPromise: Promise<IDBDatabase> | null = null;

export async function initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains("tasks")) {
                db.createObjectStore(STORE.TASKS, { keyPath: "id" })
            }

            if (!db.objectStoreNames.contains("syncQueue")) {
                db.createObjectStore(STORE.SYNC_QUEUE, { keyPath: "id" });
            }
        }

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    })
}

export function openDB(): Promise<IDBDatabase> {
  if (!dbPromise) dbPromise = initDB();
  return dbPromise;
}

function runTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB().then(db => {
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const req = operation(store);

      tx.oncomplete = () => resolve(req.result);
      tx.onerror    = () => reject(tx.error);
      tx.onabort    = () => reject(tx.error);
    });
  });
}

export async function saveTask(task: Task) {
    return runTransaction(STORE.TASKS, "readwrite", (store) => store.put(task));
}

export async function queueTaskForSync(task: Task) {
    return runTransaction(STORE.SYNC_QUEUE, "readwrite", (store) => store.put(task));
}

export async function getSyncQueue() {
    return runTransaction(STORE.SYNC_QUEUE, "readonly", (store) => store.getAll());
}

export async function clearSyncQueue() {
    return runTransaction(STORE.SYNC_QUEUE, "readwrite", (store) => store.clear());
}

export async function getTasks() {
    return runTransaction(STORE.TASKS, "readonly", (store) => store.getAll());
}

export async function deleteTask(id: string) {
    return runTransaction(STORE.TASKS, "readwrite", (store) => store.delete(id));
}
