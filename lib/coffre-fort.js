// Coffre-Fort d'Horodatage — textes partagés (client + serveur)
// Toute modification des CGU doit incrémenter CGU_VERSION.

export const CGU_VERSION = "2026-09-25-v1";

export const CGU_TEXTE = `CONDITIONS DU COFFRE-FORT D'HORODATAGE LISIBLE (version ${CGU_VERSION})

En scellant cette œuvre au Coffre-Fort d'Horodatage, je déclare sur l'honneur :
1. Être l'auteur de cette œuvre ;
2. L'avoir écrite moi-même, sans génération intégrale par une intelligence artificielle (une aide ponctuelle — correction orthographique, reformulation légère — reste possible) ;
3. Qu'elle ne constitue pas un plagiat, total ou partiel, d'une œuvre existante.

Le certificat émis scelle l'horodatage de ce dépôt : il témoigne de l'antériorité de l'œuvre telle que déposée. Lisible conserve dans son archive l'empreinte cryptographique SHA-256 du texte et la date exacte du dépôt.

Ce certificat atteste de l'existence de l'œuvre à la date indiquée. Il ne constitue pas un dépôt légal au sens du Code de la propriété intellectuelle et ne se substitue à aucune formalité officielle.

Le scellé est définitif : le certificat porte sur le texte tel que déposé. Toute modification ultérieure de l'œuvre nécessitera un nouveau scellé.`;

export const URL_CERTIFICAT = (id) => `https://lisible.biz/certificat/${id}`;

// Courte description mettant en valeur l'œuvre ET le service (partage réseaux sociaux)
export function textePartage(c) {
  const date = (() => {
    try {
      return new Date(c.deposeLe).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  })();
  return `📜 « ${c.titre} » de ${c.auteur} — Antériorité littéraire certifiée le ${date} par le Coffre-Fort Lisible 🔏 Protégez vos œuvres gratuitement :`;
}

export function liensPartage(c) {
  const u = encodeURIComponent(URL_CERTIFICAT(c.id));
  const t = encodeURIComponent(textePartage(c));
  return [
    { nom: "X", url: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { nom: "Facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { nom: "WhatsApp", url: `https://wa.me/?text=${t}%20${u}` },
    { nom: "LinkedIn", url: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { nom: "Telegram", url: `https://t.me/share/url?url=${u}&text=${t}` },
  ];
}
