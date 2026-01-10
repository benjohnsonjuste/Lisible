// api/comment.ts
import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    // Récupérer le token Firebase depuis l'en-tête Authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];

    // Vérifier le token
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;
    const email = decoded.email;

    // Récupérer les données du commentaire
    const { textId, content } = await req.json();

    if (!textId || !content) {
      return NextResponse.json({ error: "textId et content requis" }, { status: 400 });
    }

    // TODO : enregistrer le commentaire dans ta base (Firebase, Supabase, MongoDB, etc.)
    // Exemple pseudo :
    // await db.collection("comments").add({ textId, content, uid, email, createdAt: new Date() });

    console.log("Commentaire publié par :", uid, email);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erreur POST /api/comment:", err);
    return NextResponse.json({ error: "Token invalide ou erreur serveur" }, { status: 401 });
  }
}