/**
 * storage.js
 * Thin localStorage wrapper. All persistence goes through here so the
 * backend can be swapped without touching anything else.
 */

const Storage = {
  PREFIX: 'pis_',

  // Save any value under a namespaced key
  save(key, data) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage.save failed:', e);
      return false;
    }
  },

  // Load a value (returns null if absent or parse fails)
  load(key) {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  remove(key) {
    localStorage.removeItem(this.PREFIX + key);
  },

  // --- Client-specific helpers ---

  saveClient(client) {
    // TODO: assign id, update timestamps, maintain index
    return client.id;
  },

  loadClient(id) {
    // TODO: load from pis_client_<id>
    return null;
  },

  listClients() {
    // TODO: load client index array
    return [];
  },

  deleteClient(id) {
    // TODO: remove from index and delete record
  },

  clearAll() {
    // TODO: remove all pis_ keys
  }
};
