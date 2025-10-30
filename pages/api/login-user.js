import { getFileContent } from "@/lib/githubClient";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const { email, password } = req.body;

  try {
    const raw = await getFileContent({ path: "public/data/users/index.json" });
    const users = JSON.parse(raw);

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: "Email ou mot de passe incorrect" });

    res.status(200).json({ message: "Connexion réussie", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de se connecter" });
  }
}