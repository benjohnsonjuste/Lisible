// app/api/confirm-delete/route.js
import { getFile, updateFile, getEmailId } from "@/lib/github";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return new Response("Données manquantes", { status: 400 });
  }

  try {
    const path = `data/users/${getEmailId(email)}.json`;
    const userRes = await getFile(path);

    if (!userRes) {
      return new Response("Utilisateur introuvable", { status: 404 });
    }
    
    let user = userRes.content;

    // Vérification du token
    if (!user.deletionToken || user.deletionToken.token !== token) {
      return new Response("Lien invalide", { status: 400 });
    }

    if (new Date(user.deletionToken.expiresAt) < new Date()) {
      return new Response("Lien expiré", { status: 400 });
    }

    // Soft-delete : On marque comme supprimé et on vide les infos sensibles
    user.status = "deleted";
    user.deletedAt = new Date().toISOString();
    delete user.deletionToken;
    user.wallet.balance = 0; // On remet à zéro pour éviter les abus

    await updateFile(path, user, userRes.sha, `🚫 Compte supprimé : ${email}`);

    // Redirection vers une page de confirmation sur ton site
    const baseUrl = new URL(req.url).origin;
    return NextResponse.redirect(`${baseUrl}/login?message=account_deleted`);

  } catch (error) {
    console.error("Delete Confirmation Error:", error);
    return new Response("Erreur lors de la suppression", { status: 500 });
  }
}
