import { NextResponse } from "next/server";

// Configuration de la marketplace
const PLATFORM_FEE_PERCENT = 0.15; // Ta commission de 15%
const ADMIN_EMAIL = "ton-email@admin.com"; // Compte qui reçoit les commissions

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, taskId, userEmail, taskData } = body;

    // Simulation de base de données (À interfacer avec ton github-db)
    // 1. Charger les fichiers users.json et tasks.json

    switch (action) {
      case "create_task":
        // VÉRIFICATION : Le client a-t-il assez de Li ?
        // On bloque immédiatement le montant total (Prix + Frais éventuels)
        // Action : Débiter le client -> Mettre en "Pending" dans tasks.json
        return NextResponse.json({ message: "Tâche publiée et Li réservés" });

      case "accept_task":
        // Action : Lier writerEmail à la tâche et passer le status à 'in_progress'
        return NextResponse.json({ message: "Mission acceptée" });

      case "complete_task":
        // LE MOMENT CRITIQUE : Distribution des Li
        // 1. Calcul de la part écrivain et de la commission
        const totalLi = taskData.priceLi;
        const commission = Math.floor(totalLi * PLATFORM_FEE_PERCENT);
        const writerNet = totalLi - commission;

        // 2. Transfert vers l'écrivain
        // Action : POST /api/github-db { action: "add_li", userEmail: writerEmail, amount: writerNet }
        
        // 3. Transfert de la commission vers l'admin
        // Action : POST /api/github-db { action: "add_li", userEmail: ADMIN_EMAIL, amount: commission }

        return NextResponse.json({ 
          success: true, 
          distributed: { writer: writerNet, platform: commission } 
        });

      default:
        return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
