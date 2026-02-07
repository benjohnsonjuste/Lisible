import { NextResponse } from "next/server";
import { getFile } from "@/lib/github"; // ou tes imports habituels

export async function GET(req, { params }) {
  try {
    const authorId = params.id;
    
    // TA LOGIQUE ICI pour récupérer les œuvres de l'auteur...
    // Exemple : const res = await getFile(`data/authors/${authorId}.json`);
    
    return NextResponse.json({ success: true, works: [] }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
