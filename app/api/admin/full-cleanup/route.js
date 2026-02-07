// app/api/admin/full-cleanup/route.js
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const OWNER = "benjohnsonjuste";
const REPO = "Lisible";

export async function GET(req) {
  // Sécurité : Vérifier le token secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CLEANUP_TOKEN}`) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const report = { usersFixed: 0, textsFixed: 0, balanceCorrected: 0 };

    // --- 1. NETTOYAGE ET RÉCONCILIATION DES UTILISATEURS ---
    const { data: userFiles } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: "data/users" });
    
    for (const file of userFiles) {
      if (!file.name.endsWith('.json')) continue;
      const { data: content } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: file.path });
      const user = JSON.parse(Buffer.from(content.content, 'base64').toString());
      let changed = false;

      // A. Structure de base
      if (!Array.isArray(user.subscribers)) { user.subscribers = []; changed = true; }
      if (!user.wallet) { user.wallet = { balance: 0, history: [] }; changed = true; }
      if (!Array.isArray(user.wallet.history)) { user.wallet.history = []; changed = true; }

      // B. RÉCONCILIATION DU SOLDE (Audit financier)
      const actualBalance = user.wallet.history.reduce((acc, trans) => {
        const amt = parseFloat(trans.amount) || 0;
        return trans.type === 'credit' || trans.type === 'receive' ? acc + amt : acc - amt;
      }, 0);

      if (user.wallet.balance !== actualBalance) {
        user.wallet.balance = actualBalance;
        changed = true;
        report.balanceCorrected++;
      }

      // C. Nettoyage email
      if (user.email) { 
        const cleanEmail = user.email.toLowerCase().trim();
        if (user.email !== cleanEmail) { user.email = cleanEmail; changed = true; }
      }

      if (changed) {
        await octokit.repos.createOrUpdateFileContents({
          owner: OWNER, repo: REPO, path: file.path, sha: content.sha,
          message: "🛠 Nettoyage & Audit financier auto",
          content: Buffer.from(JSON.stringify(user, null, 2)).toString('base64')
        });
        report.usersFixed++;
      }
    }

    // --- 2. NETTOYAGE DES PUBLICATIONS ---
    const { data: textFiles } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: "data/publications" });

    for (const file of textFiles) {
      if (!file.name.endsWith('.json')) continue;
      const { data: content } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: file.path });
      const text = JSON.parse(Buffer.from(content.content, 'base64').toString());
      let changed = false;

      if (typeof text.views !== 'number') { text.views = 0; changed = true; }
      if (typeof text.totalCertified !== 'number') { text.totalCertified = 0; changed = true; }
      if (!Array.isArray(text.voters)) { text.voters = []; changed = true; }

      if (changed) {
        await octokit.repos.createOrUpdateFileContents({
          owner: OWNER, repo: REPO, path: file.path, sha: content.sha,
          message: "🛠 Nettoyage auto : Publication",
          content: Buffer.from(JSON.stringify(text, null, 2)).toString('base64')
        });
        report.textsFixed++;
      }
    }

    return new Response(JSON.stringify({ status: "Audit et Nettoyage réussis", report }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
