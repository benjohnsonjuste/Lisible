import { getFile, updateFile } from "@/lib/github";

export default async function handler(req, res) {
  if (req.method !== "PATCH") return res.status(405).end();

  const { email, userData } = req.body;
  const fileName = Buffer.from(email.toLowerCase().trim()).toString("base64").replace(/=/g, "");
  const path = `data/users/${fileName}.json`;

  const sanitize = (str) => (typeof str === "string" ? str.replace(/[<>]/g, "") : str);

  try {
    const userFile = await getFile(path);
    if (!userFile) return res.status(404).json({ error: "Profil introuvable" });

    const updatedProfile = {
      ...userFile.content,
      ...userData,
      firstName: sanitize(userData.firstName),
      lastName: sanitize(userData.lastName),
      penName: sanitize(userData.penName),
      wallet: userFile.content.wallet, 
      stats: userFile.content.stats,   
      updatedAt: new Date().toISOString()
    };

    await updateFile(path, updatedProfile, userFile.sha, `👤 Profil MAJ: ${email}`);

    // AUTOMATISME : Mise à jour instantanée du cache Vercel
    try {
      await res.revalidate('/communaute');
    } catch (err) {
      console.error("Revalidation error", err);
    }

    return res.status(200).json({ success: true, user: updatedProfile });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
