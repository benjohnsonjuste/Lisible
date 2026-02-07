// app/api/certify/route.js
import { NextResponse } from "next/server";
import { getFile, updateFile, getEmailId } from "@/lib/github";

export async function POST(req) {
  try {
    const { readerEmail, textId, authorEmail } = await req.json();
    const COST_LI = 1000; // Coût d'une certification

    if (!readerEmail || !textId || !authorEmail) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // 1. Charger le lecteur
    const readerRes = await getFile(`data/users/${getEmailId(readerEmail)}.json`);
    if (!readerRes) {
      return NextResponse.json({ error: "Lecteur introuvable" }, { status: 404 });
    }
    let reader = readerRes.content;

    if (reader.wallet.balance < COST_LI) {
      return NextResponse.json({ error: "Solde Li insuffisant pour certifier." }, { status: 400 });
    }

    // 2. Charger l'auteur
    const authorRes = await getFile(`data/users/${getEmailId(authorEmail)}.json`);
    if (!authorRes) {
      return NextResponse.json({ error: "Auteur introuvable" }, { status: 404 });
    }
    let author = authorRes.content;

    // 3. Charger le texte
    const textRes = await getFile(`data/publications/${textId}.json`);
    if (!textRes) {
      return NextResponse.json({ error: "Texte introuvable" }, { status: 404 });
    }
    let text = textRes.content;

    // --- TRANSACTION ---
    // Débit lecteur
    reader.wallet.balance -= COST_LI;
    reader.wallet.history.unshift({
      id: `cert-out-${Date.now()}`,
      date: new Date().toISOString(),
      amount: -COST_LI,
      reason: `Certification du texte: ${text.title}`,
      type: "certification_sent"
    });

    // Crédit auteur
    author.wallet.balance += COST_LI;
    author.wallet.history.unshift({
      id: `cert-in-${Date.now()}`,
      date: new Date().toISOString(),
      amount: COST_LI,
      reason: `Certification reçue pour: ${text.title}`,
      type: "certification_received"
    });

    // Mise à jour du texte
    text.totalCertified = (text.totalCertified || 0) + 1;
    if (!text.voters) text.voters = [];
    text.voters.push(readerEmail);

    // 4. SAUVEGARDE SYNCHRONE (Audit trail)
    // On enchaîne les mises à jour sur GitHub
    await updateFile(
      `data/users/${getEmailId(readerEmail)}.json`, 
      reader, 
      readerRes.sha, 
      `🛡️ Certification débit: ${readerEmail}`
    );
    await updateFile(
      `data/users/${getEmailId(authorEmail)}.json`, 
      author, 
      authorRes.sha, 
      `💰 Certification crédit: ${authorEmail}`
    );
    await updateFile(
      `data/publications/${textId}.json`, 
      text, 
      textRes.sha, 
      `✨ Texte certifié: ${textId}`
    );

    return NextResponse.json({ 
      success: true, 
      newBalance: reader.wallet.balance 
    }, { status: 200 });

  } catch (e) {
    console.error("Certification Error:", e);
    return NextResponse.json({ error: "Erreur lors de la certification" }, { status: 500 });
  }
}
