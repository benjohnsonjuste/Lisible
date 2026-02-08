import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const data = await req.json();
    const { title, content, authorEmail, penName, isConcours } = data;

    const fileName = `${Buffer.from(`${title}-${Date.now()}`).toString('base64').substring(0, 15)}.json`;
    const path = `data/texts/${fileName}`;
    const githubToken = process.env.GITHUB_TOKEN; // À configurer dans Vercel
    const repoOwner = "benjohnsonjuste";
    const repoName = "Lisible";

    const fileContent = {
      title,
      content,
      authorEmail,
      penName,
      isConcours: isConcours || false,
      createdAt: new Date().toISOString(),
      stats: { views: 0, likes: 0, certified: 0 }
    };

    // 1. Envoyer vers GitHub
    const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `📚 Nouveau texte : ${title}`,
        content: Buffer.from(JSON.stringify(fileContent, null, 2)).toString('base64'),
      }),
    });

    if (!res.ok) throw new Error("Erreur GitHub API");

    return NextResponse.json({ success: true, path });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
