const Storage = {
  PREFIX: 'pis_',

  save(key, data) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage.save failed:', e);
      return false;
    }
  },

  load(key) {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Storage.load failed:', e);
      return null;
    }
  },

  remove(key) {
    localStorage.removeItem(this.PREFIX + key);
  },

  saveClient(client) {
    const id = client.id || this.generateId();
    client.id = id;
    client.updatedAt = new Date().toISOString();
    if (!client.createdAt) client.createdAt = client.updatedAt;

    const clients = this.listClients();
    const idx     = clients.findIndex(c => c.id === id);
    const summary = { id, name: client.profile.fullName || 'Unnamed', updatedAt: client.updatedAt };

    if (idx >= 0) clients[idx] = summary;
    else          clients.push(summary);

    this.save('clients', clients);
    this.save('client_' + id, client);
    return id;
  },

  loadClient(id) {
    return this.load('client_' + id);
  },

  listClients() {
    return this.load('clients') || [];
  },

  deleteClient(id) {
    const clients = this.listClients().filter(c => c.id !== id);
    this.save('clients', clients);
    this.remove('client_' + id);
  },

  generateId() {
    return 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  clearAll() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.PREFIX))
      .forEach(k => localStorage.removeItem(k));
  }
};
