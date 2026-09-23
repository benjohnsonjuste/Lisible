// Résolution d'identité serveur à partir d'un jeton de session.
// Les flux d'argent ne font JAMAIS confiance à un email envoyé par le client :
// toute action sensible passe par getSessionUser(sessionToken).

import { getFile, getSafePath, updateFile, deleteFile } from "./github.js";

const SESSION_DIR = "data/sessions";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

const sessionPath = (token) => `${SESSION_DIR}/${token}.json`;

function newToken() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

// Crée une session pour un utilisateur déjà authentifié (email + chemin du fichier).
// Écrit un fichier central data/sessions/<token>.json ET ajoute le token
// au tableau sessions du fichier utilisateur (avec purge des expirés).
export async function createSession(email, userPath) {
  const token = newToken();
  const now = Date.now();
  const session = {
    token,
    email: email.toLowerCase().trim(),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
  };
  // 1. Fichier central (résolution O(1))
  await updateFile(sessionPath(token), session, null, `🔑 Session créée`);
  // 2. Tableau dans le fichier utilisateur (révocation côté compte) — relecture fraîche du sha
  try {
    const userFile = await getFile(userPath);
    if (userFile && !userFile.isDir) {
      const sessions = Array.isArray(userFile.content.sessions) ? userFile.content.sessions : [];
      const valides = sessions.filter((s) => s && s.expiresAt && new Date(s.expiresAt).getTime() > now);
      valides.push(session);
      userFile.content.sessions = valides;
      await updateFile(userPath, userFile.content, userFile.sha, `🔑 Nouvelle session`);
    }
  } catch (e) {
    console.error("createSession (tableau utilisateur):", e.message);
  }
  return token;
}

// Détruit une session (déconnexion).
export async function destroySession(token) {
  if (!token) return;
  try {
    const file = await getFile(sessionPath(token));
    if (file && !file.isDir) {
      await deleteFile(sessionPath(token), file.sha);
      const email = file.content && file.content.email;
      if (email) {
        const userPath = getSafePath(email);
        const userFile = await getFile(userPath);
        if (userFile && !userFile.isDir && Array.isArray(userFile.content.sessions)) {
          userFile.content.sessions = userFile.content.sessions.filter((s) => s && s.token !== token);
          await updateFile(userPath, userFile.content, userFile.sha, `🔑 Session révoquée`);
        }
      }
    }
  } catch (e) {
    console.error("destroySession:", e.message);
  }
}

// Résout un jeton de session → {email, name, user, path, sha} | null.
export async function getSessionUser(token) {
  if (!token || typeof token !== "string") return null;
  const file = await getFile(sessionPath(token));
  if (!file || file.isDir || !file.content) return null;
  const session = file.content;
  if (!session.email || !session.expiresAt) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await destroySession(token); // nettoyage d'une session expirée
    return null;
  }
  const userPath = getSafePath(session.email);
  const userFile = await getFile(userPath);
  if (!userFile || userFile.isDir || !userFile.content || userFile.content.status === "deleted") return null;
  const sessions = Array.isArray(userFile.content.sessions) ? userFile.content.sessions : [];
  const found = sessions.find(
    (s) => s && s.token === token && s.expiresAt && new Date(s.expiresAt).getTime() > Date.now()
  );
  if (!found) return null; // jeton révoqué côté compte
  return {
    email: userFile.content.email,
    name: userFile.content.penName || userFile.content.name || "Auteur",
    user: userFile.content,
    path: userPath,
    sha: userFile.sha,
  };
}
