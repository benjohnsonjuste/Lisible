import { getFile, updateFile } from "@/lib/github";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { email, userData } = body;

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const fileName = Buffer.from(email.toLowerCase().trim()).toString("base64").replace(/=/g, "");
    const path = `data/users/${fileName}.json`;

    const sanitize = (str) => (typeof str === "string" ? str.replace(/[<>]/g, "") : str);

    const userFile = await getFile(path);
    if (!userFile) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
    }

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
      revalidatePath('/communaute');
    } catch (err) {
      console.error("Revalidation error", err);
    }

    return NextResponse.json({ success: true, user: updatedProfile }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
