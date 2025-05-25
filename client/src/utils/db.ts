import { Task } from "@/types";

const DB_NAME = "tiny-sync-db"

// In a production environment, we would retrieve this version remotely.
// It would be a hash of the DB schema + whatever internal versioning is used on the server.
// e.g. tiny-sync_{HASH}
// If the hashes wouldn't match, we'd just create a new database.
const DB_VERSION = 1;

// Ideally we'd also map the Table names to a hashed schema.
// On runtime, we'd request a list of tables and their hashes. We'd look that up in our metadata table.
// If the hash was missing in our IndexedDB, we'd need to refetch the data only for that table.
// Above assumes we have partial bootstrapping implemented, which we don't. Not sure if this is worth the effort.
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
