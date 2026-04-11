/**
 * storage.js
 * -----------
 * Thin wrapper around localStorage for persisting the client roster.
 * Keeps all persistence concerns in one place so we can later swap the
 * implementation for a real backend (IndexedDB, REST API, Firestore, ...)
 * without touching the rest of the app.
 */

const KEY = 'cc_clients_v1';

export const storage = {
  /** Returns all clients as an array (never null). */
  all() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error('[storage] failed to parse clients', err);
      return [];
    }
  },

  /** Persists the full client list. */
  saveAll(clients) {
    localStorage.setItem(KEY, JSON.stringify(clients));
  },

  /** Finds a client by id, or undefined. */
  get(id) {
    return this.all().find((c) => c.id === id);
  },

  /** Inserts or updates a client in place. */
  upsert(client) {
    const all = this.all();
    const idx = all.findIndex((c) => c.id === client.id);
    if (idx >= 0) all[idx] = client;
    else all.push(client);
    this.saveAll(all);
  },

  /** Removes a client by id. */
  remove(id) {
    this.saveAll(this.all().filter((c) => c.id !== id));
  },

  /** Wipes the entire roster. */
  clear() {
    localStorage.removeItem(KEY);
  },
};
