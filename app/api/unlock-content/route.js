// app/api/unlock-content/route.js
// Route désactivée : l'achat de contenu premium est géré par le module Économie (/api/economie).
// Conservée pour ne pas casser d'éventuels anciens appels clients : répond 501 au lieu d'une erreur 500.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Fonctionnalité non disponible pour le moment. Utilisez le module Économie." },
    { status: 501 }
  );
}
