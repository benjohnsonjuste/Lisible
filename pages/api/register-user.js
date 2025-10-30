import { createOrUpdateFile, getFileContent } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const { firstName, lastName, penName, email, password, avatar } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: "Champs requis manquants" });
  }

  try {
    // Crée le dossier utilisateurs si besoin
    const usersPath = "public/data/users/index.json";
    let users = [];
    try {
      const raw = await getFileContent({ path: usersPath });
      users = JSON.parse(raw);
    } catch {}

    // Vérifie si email déjà utilisé
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }

    const newUser = {
      id: Date.now().toString(),
      firstName,
      lastName,
      penName,
      email,
      password, // à sécuriser (hasher) pour prod
      avatar: avatar || "avatar.png",
      subscribers: [],
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    await createOrUpdateFile({
      path: usersPath,
      content: JSON.stringify(users, null, 2),
      message: `Nouvel utilisateur ${firstName} ${lastName}`,
    });

    res.status(200).json({ message: "Utilisateur créé !" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de créer l'utilisateur" });
  }
}