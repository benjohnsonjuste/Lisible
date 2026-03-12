import { NextResponse } from 'next/server';

const GITHUB_CONFIG = {
  owner: "benjohnsonjuste",
  repo: "Lisible",
  token: process.env.GITHUB_TOKEN
};

export async function POST(req) {
  const body = await req.json();
  const { action, userEmail, content, userName } = body;

  // 1. Action : S'abonner / Se désabonner
  if (action === "toggle_sub") {
    const filePath = `data/forum/subscribers/${userEmail.replace(/[@.]/g, '_')}.json`;
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filePath}`;

    // Vérifier si déjà abonné
    const check = await fetch(url, { headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}` } });
    
    if (check.ok) {
      // Déjà existe -> Supprimer (Désabonnement)
      const fileData = await check.json();
      await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Unsub: ${userEmail}`, sha: fileData.sha })
      });
      return NextResponse.json({ status: "unsubscribed" });
    } else {
      // Créer (Abonnement)
      await fetch(url, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Sub: ${userEmail}`,
          content: btoa(JSON.stringify({ email: userEmail, date: new Date().toISOString() }))
        })
      });
      return NextResponse.json({ status: "subscribed" });
    }
  }

  // 2. Action : Envoyer un message
  if (action === "send_message") {
    const msgId = Date.now();
    const filePath = `data/forum/messages/${msgId}.json`;
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filePath}`;

    await fetch(url, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${GITHUB_CONFIG.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `New forum message from ${userName}`,
        content: btoa(JSON.stringify({ 
          id: msgId, 
          author: userName, 
          email: userEmail, 
          text: content, 
          date: new Date().toISOString() 
        }))
      })
    });
    
    // Ici, tu pourrais déclencher un service de mail (Resend ou EmailJS) 
    // en bouclant sur le dossier data/forum/subscribers
    
    return NextResponse.json({ success: true });
  }
}
