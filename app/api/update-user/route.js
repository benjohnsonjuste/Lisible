import { getFile, updateFile } from "@/lib/github";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { email, userData } = body;

    if (!email) {
      return NextResponse.json({ error: "Email manquant" }, { status: 400 });
    }

    const fileName = Buffer.from(email.toLowerCase().trim()).toString("base64").replace(/=/g, "");
    const path = `data/users/${fileName}.json`;

    const sanitize = (str) => (typeof str === "string" ? str.replace(/[<>]/g, "") : str);

    // Récupération via ton utilitaire GitHub
    const userFile = await getFile(path);
    if (!userFile) {
      return NextResponse.json({ error: "Profil introuvable sur le dépôt" }, { status: 404 });
    }

    const updatedProfile = {
      ...userFile.content,
      ...userData,
      firstName: sanitize(userData.firstName),
      lastName: sanitize(userData.lastName),
      penName: sanitize(userData.penName),
      wallet: userFile.content.wallet, // Protection : On ne touche pas au solde ici
      stats: userFile.content.stats,   // Protection : On ne touche pas aux stats ici
      updatedAt: new Date().toISOString()
    };

    // Mise à jour sur GitHub
    await updateFile(path, updatedProfile, userFile.sha, `👤 Profil MAJ: ${email}`);

    // Revalidation du cache Next.js pour la page communauté
    try {
      revalidatePath('/communaute');
    } catch (err) {
      console.error("Revalidation error", err);
    }

    return NextResponse.json({ 
      success: true, 
      user: updatedProfile 
    }, { status: 200 });

  } catch (e) {
    console.error("Update User Error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
