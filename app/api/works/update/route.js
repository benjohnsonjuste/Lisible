// app/api/works/update/route.js
import { Buffer } from "buffer";

export async function PUT(req) {
  try {
    const body = await req.json();
    const { workId, updatedData, userEmail } = body;

    if (!workId || !updatedData || !userEmail) {
      return new Response(JSON.stringify({ error: "Données manquantes" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fileName = workId.endsWith(".json") ? workId : `${workId}.json`;
    const textPath = `data/texts/${fileName}`;
    const indexPath = `data/publications/index.json`;

    const headers = {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    };

    // 1. RÉCUPÉRER LE FICHIER COMPLET POUR VÉRIFIER LE PROPRIÉTAIRE
    const getFileRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${textPath}?t=${Date.now()}`,
      { headers, cache: 'no-store' }
    );

    if (!getFileRes.ok) {
      return new Response(JSON.stringify({ error: "Œuvre introuvable dans la base de données" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const fileData = await getFileRes.json();
    const currentContent = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf-8'));

    // 2. VÉRIFICATION DE SÉCURITÉ
    const authorEmailInFile = currentContent.authorEmail || currentContent.authorId;
    if (authorEmailInFile?.toLowerCase() !== userEmail.toLowerCase()) {
      return new Response(JSON.stringify({ error: "Action interdite : vous n'êtes pas l'auteur." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. PRÉPARATION DU NOUVEAU CONTENU COMPLET
    const finalContent = {
      ...currentContent,
      ...updatedData,
      updatedAt: new Date().toISOString()
    };

    // 4. MISE À JOUR DU FICHIER COMPLET DANS /data/texts/
    const updateFileRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${textPath}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `Update text: ${finalContent.title}`,
          content: Buffer.from(JSON.stringify(finalContent, null, 2)).toString('base64'),
          sha: fileData.sha,
        }),
      }
    );

    if (!updateFileRes.ok) throw new Error("Échec de la mise à jour du texte complet");

    // 5. MISE À JOUR DE L'INDEX GLOBAL (/data/publications/index.json)
    const getIndexRes = await fetch(
      `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${indexPath}?t=${Date.now()}`,
      { headers, cache: 'no-store' }
    );

    if (getIndexRes.ok) {
      const indexFileData = await getIndexRes.json();
      let indexArray = JSON.parse(Buffer.from(indexFileData.content, 'base64').toString('utf-8'));

      // On met à jour l'entrée correspondante dans l'index
      indexArray = indexArray.map(item => {
        if (item.id === workId) {
          return {
            ...item,
            title: updatedData.title || item.title,
            genre: updatedData.category || updatedData.genre || item.genre,
            // On ne stocke qu'un extrait dans l'index pour la performance
            content: updatedData.content ? updatedData.content.substring(0, 300) : item.content,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });

      await fetch(
        `https://api.github.com/repos/benjohnsonjuste/Lisible/contents/${indexPath}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            message: `Update index for: ${workId}`,
            content: Buffer.from(JSON.stringify(indexArray, null, 2)).toString('base64'),
            sha: indexFileData.sha,
          }),
        }
      );
    }

    return new Response(JSON.stringify({ message: "Œuvre et index mis à jour avec succès" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erreur API Update:", error);
    return new Response(JSON.stringify({ error: "Erreur lors de la modification synchronisée" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
