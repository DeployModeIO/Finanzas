(function (global) {
  "use strict";

  const DB_NAME = "meridiano";
  const DB_VERSION = 1;
  const TIMEOUT = 3000;
  let dbPromise = null;
  const memory = { positions: [], meta: {}, idbDown: false };

  function race(promise, label, fallbackValue) {
    if (memory.idbDown) return Promise.resolve(fallbackValue);
    let timer;
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => {
        memory.idbDown = true;
        resolve(fallbackValue);
      }, TIMEOUT);
    });
    return Promise.race([promise, timeout]).then((v) => {
      clearTimeout(timer);
      return v;
    });
  }

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!global.indexedDB) {
        reject(new Error("IndexedDB no disponible"));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("positions")) {
          db.createObjectStore("positions", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta", { keyPath: "key" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error("IndexedDB bloqueada"));
    }).catch(() => {
      memory.idbDown = true;
      return null;
    });
    return dbPromise;
  }

  function tx(store, mode) {
    return open().then((db) => {
      if (!db) return null;
      return db.transaction(store, mode).objectStore(store);
    });
  }

  function request(store, mode, op) {
    return tx(store, mode).then((os) => {
      if (!os) return null;
      return new Promise((resolve, reject) => {
        const req = op(os);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    });
  }

  async function all(store) {
    const result = await race(request(store, "readonly", (os) => os.getAll()), "all:" + store, null);
    return result ?? (store === "positions" ? memory.positions.slice() : []);
  }

  async function put(store, value) {
    const result = await race(request(store, "readwrite", (os) => os.put(value)), "put:" + store, null);
    if (result === null) {
      if (store === "positions") {
        const i = memory.positions.findIndex((p) => p.id === value.id);
        if (i >= 0) memory.positions[i] = value;
        else {
          value.id = memory.positions.length ? Math.max(...memory.positions.map((p) => p.id)) + 1 : 1;
          memory.positions.push(value);
        }
        return value.id;
      }
      if (store === "meta") {
        memory.meta[value.key] = value.value;
        return value.key;
      }
    }
    return result;
  }

  async function del(store, key) {
    return race(request(store, "readwrite", (os) => os.delete(key)), "del:" + store, null).then((r) => {
      if (r === null && store === "positions") {
        memory.positions = memory.positions.filter((p) => p.id !== key);
      }
    });
  }

  async function getPositions() {
    return all("positions");
  }

  async function addPosition({ ticker, qty, price, date }) {
    return put("positions", { ticker, qty, price, date: date || new Date().toISOString().slice(0, 10) });
  }

  async function updatePosition(pos) {
    return put("positions", pos);
  }

  async function deletePosition(id) {
    return del("positions", id);
  }

  async function getMeta(key, fallback) {
    const result = await race(request("meta", "readonly", (os) => os.get(key)), "getMeta:" + key, null);
    if (result === null) return key in memory.meta ? memory.meta[key] : fallback;
    return result ? result.value : fallback;
  }

  async function setMeta(key, value) {
    return put("meta", { key, value });
  }

  global.Portfolio = {
    getPositions, addPosition, updatePosition, deletePosition,
    getMeta, setMeta
  };
})(window);
