import { NextResponse } from "next/server";

// Simulé : Remplacez par votre logique de connexion GitHub/Database réelle
export async function DELETE(request) {
  try {
    const { textId } = await request.json();

    if (!textId) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    // Ici, vous appelez votre service de base de données ou GitHub
    // Exemple pour GitHub DB :
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/github-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'delete_text', 
        textId: textId 
      })
    });

    if (res.ok) {
      return NextResponse.json({ success: true });
    } else {
      throw new Error("Erreur serveur");
    }

  } catch (error) {
    return NextResponse.json({ error: "Échec de l'opération" }, { status: 500 });
  }
}

// Optionnel : Gérer les mises à jour rapides via PUT
export async function PUT(request) {
  const data = await request.json();
  // Logique pour mettre à jour les métadonnées (titre, catégorie...)
  return NextResponse.json({ success: true });
}
