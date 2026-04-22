const API_URL = '/api/github-db';

export const dataService = {
  // --- LECTURE ---
  async getLibrary() {
    const res = await fetch(`${API_URL}?type=library`);
    const data = await res.json();
    return data?.content || [];
  },

  async getText(id) {
    const res = await fetch(`${API_URL}?type=text&id=${id}`);
    const data = await res.json();
    return data?.content;
  },

  async getUser(email) {
    const res = await fetch(`${API_URL}?type=user&id=${email}`);
    const data = await res.json();
    return data?.content;
  },

  // --- ACTIONS ---
  async postAction(action, payload) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    });
    return res.json();
  },

  async updateStats(id, action) {
    const res = await fetch(API_URL, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action })
    });
    return res.json();
  }
};
