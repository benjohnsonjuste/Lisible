/**
 * Service de communication avec l'API github-db
 * Emplacement : lib/api.js
 */

const API_PATH = '/api/github-db';

export const dataService = {
  // --- RÉCUPÉRATION (GET) ---
  
  /** Récupère la liste de tous les textes (index.json) */
  async getLibrary() {
    try {
      const res = await fetch(`${API_PATH}?type=library`);
      const data = await res.json();
      return data?.content || [];
    } catch (err) {
      console.error("Erreur getLibrary:", err);
      return [];
    }
  },

  /** Récupère un texte spécifique par son ID */
  async getText(id) {
    try {
      const res = await fetch(`${API_PATH}?type=text&id=${id}`);
      const data = await res.json();
      return data?.content || null;
    } catch (err) {
      console.error("Erreur getText:", err);
      return null;
    }
  },

  /** Récupère les données d'un utilisateur par son email */
  async getUser(email) {
    try {
      const res = await fetch(`${API_PATH}?type=user&id=${email}`);
      const data = await res.json();
      return data?.content || null;
    } catch (err) {
      console.error("Erreur getUser:", err);
      return null;
    }
  },

  // --- ACTIONS (POST) ---

  /** Envoie une action (register, login, publish, follow, transfer_li, etc.) */
  async postAction(action, payload) {
    try {
      const res = await fetch(API_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      return await res.json();
    } catch (err) {
      console.error(`Erreur action ${action}:`, err);
      return { error: "Erreur de connexion au serveur" };
    }
  },

  // --- MISES À JOUR RAPIDES (PATCH) ---

  /** Incrémente les vues, likes ou certifications */
  async updateStats(id, action) {
    try {
      const res = await fetch(API_PATH, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      return await res.json();
    } catch (err) {
      console.error(`Erreur updateStats ${action}:`, err);
      return { error: "Impossible de mettre à jour les statistiques" };
    }
  }
};
