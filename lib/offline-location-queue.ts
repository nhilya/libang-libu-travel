import type { LocationPoint } from "@/lib/operations-types";

const DB_NAME = "llt-guide-pwa";
const STORE_NAME = "location-batches";

export type QueuedLocationBatch = {
  id: string;
  tripId: string;
  points: LocationPoint[];
  queuedAt: string;
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, mode);
    const request = run(tx.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => database.close();
  });
}

export function queueLocationBatch(batch: QueuedLocationBatch) {
  return transaction("readwrite", (store) => store.put(batch));
}

export function getQueuedLocationBatches() {
  return transaction<QueuedLocationBatch[]>("readonly", (store) => store.getAll());
}

export function removeQueuedLocationBatch(id: string) {
  return transaction("readwrite", (store) => store.delete(id));
}
