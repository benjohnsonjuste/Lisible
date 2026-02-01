import { getFile, updateFile } from "@/lib/github";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const userData = req.body;
  if (!userData.email) return res.status(400).json({ error: "Email requis" });

  // UNIFICATION : Encodage Base64 pour le nom de fichier
  const fileName = Buffer.from(userData.email.toLowerCase().trim()).toString("base64").replace(/=/g, "");
  const path = `data/users/${fileName}.json`;

  try {
    const userFile = await getFile(path);
    const oldProfile = userFile ? userFile.content : {};
    const fileSha = userFile ? userFile.sha : null;

    const newProfile = { 
      ...oldProfile,
      ...userData,
      // On protège les données sensibles pour qu'elles ne soient pas écrasées par erreur
      subscribers: oldProfile.subscribers || userData.subscribers || [],
      wallet: oldProfile.wallet || userData.wallet || { balance: 0, history: [] },
      lastUpdate: new Date().toISOString() 
    };

    const success = await updateFile(path, newProfile, fileSha, `👤 Profil MAJ : ${userData.penName || userData.email}`);

    if (success) {
      try { await sendAdminNotification(newProfile); } catch (e) {}
      return res.status(200).json({ success: true, profile: newProfile });
    }
    throw new Error("Erreur GitHub");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Garde ta fonction sendAdminNotification telle quelle en dessous...
