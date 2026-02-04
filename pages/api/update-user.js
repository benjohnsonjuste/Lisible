import { getFile, updateFile } from "@/lib/github";

export default async function handler(req, res) {
  if (req.method !== "PATCH") return res.status(405).end();

  const { email, userData } = req.body;
  const fileName = Buffer.from(email.toLowerCase().trim()).toString("base64").replace(/=/g, "");
  const path = `data/users/${fileName}.json`;

  // Fonction de nettoyage pour sécuriser les entrées contre les injections XSS
  const sanitize = (str) => (typeof str === "string" ? str.replace(/[<>]/g, "") : str);

  try {
    const userFile = await getFile(path);
    if (!userFile) return res.status(404).json({ error: "Profil introuvable" });

    const updatedProfile = {
      ...userFile.content,
      ...userData,
      // Nettoyage des champs textuels sensibles
      firstName: sanitize(userData.firstName),
      lastName: sanitize(userData.lastName),
      penName: sanitize(userData.penName),
      // Protections critiques
      wallet: userFile.content.wallet, 
      stats: userFile.content.stats,   
      updatedAt: new Date().toISOString()
    };

    await updateFile(path, updatedProfile, userFile.sha, `👤 Profil MAJ: ${email}`);
    return res.status(200).json({ success: true, user: updatedProfile });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
