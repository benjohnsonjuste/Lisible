import { getFile, updateFile } from "@/lib/github";

export default async function handler(req, res) {
  if (req.method !== "PATCH") return res.status(405).end();

  const { email, userData } = req.body;
  const fileName = Buffer.from(email.toLowerCase().trim()).toString("base64").replace(/=/g, "");
  const path = `data/users/${fileName}.json`;

  try {
    const userFile = await getFile(path);
    if (!userFile) return res.status(404).json({ error: "Profil introuvable" });

    const updatedProfile = {
      ...userFile.content,
      ...userData,
      wallet: userFile.content.wallet, // PROTECTION
      stats: userFile.content.stats,   // PROTECTION
      updatedAt: new Date().toISOString()
    };

    await updateFile(path, updatedProfile, userFile.sha, `👤 Profil MAJ: ${email}`);
    return res.status(200).json({ success: true, user: updatedProfile });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
