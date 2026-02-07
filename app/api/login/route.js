// app/api/login/route.js
import { getFile } from "@/lib/github";
import { Buffer } from "buffer";
import crypto from "crypto";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email et mot de passe requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const fileName = Buffer.from(cleanEmail).toString("base64").replace(/=/g, "");
    const path = `data/users/${fileName}.json`;

    const userFile = await getFile(path);

    if (!userFile) {
      return new Response(
        JSON.stringify({ error: "Utilisateur introuvable. Veuillez vous inscrire." }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const userData = userFile.content;

    // --- VÉRIFICATION SÉCURISÉE ---
    // On hache le mot de passe reçu pour voir s'il correspond au hash enregistré
    const inputHash = crypto.createHash("sha256").update(password).digest("hex");

    // On vérifie si ça match (soit le nouveau format haché, soit l'ancien format)
    if (userData.password !== inputHash && userData.password !== password) {
      return new Response(JSON.stringify({ error: "Mot de passe incorrect." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // On ne renvoie jamais le mot de passe au client
    const { password: _, ...safeUserData } = userData;

    return new Response(
      JSON.stringify({
        success: true,
        user: safeUserData,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Login Error:", error);
    return new Response(JSON.stringify({ error: "Erreur de connexion au serveur." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
