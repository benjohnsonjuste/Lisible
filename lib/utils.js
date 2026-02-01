import { Buffer } from "buffer";

/**
 * Transforme un email en identifiant sécurisé (Base64) pour GitHub
 */
export const getEmailId = (email) => {
  if (!email) return "";
  return Buffer.from(email.toLowerCase().trim())
    .toString("base64")
    .replace(/=/g, ""); // Nettoie les "=" pour éviter les problèmes d'URL
};

/**
 * Formate les montants Li pour l'affichage
 */
export const formatLi = (amount) => {
  return new Intl.NumberFormat('fr-FR').format(amount || 0);
};
