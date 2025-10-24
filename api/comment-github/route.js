// === Mise à jour du compteur de commentaires dans index.json ===
try {
  const indexRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/data/texts/index.json`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` },
  });

  if (indexRes.ok) {
    const indexJson = await indexRes.json();
    const decoded = Buffer.from(indexJson.content, "base64").toString();
    const indexData = JSON.parse(decoded);
    const idx = indexData.findIndex((t) => t.id === textId);
    if (idx !== -1) {
      indexData[idx].comments = comments.length;
      const updated = Buffer.from(JSON.stringify(indexData, null, 2)).toString("base64");

      await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/data/texts/index.json`, {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `💬 Mise à jour compteur commentaires pour ${textId}`,
          content: updated,
          sha: indexJson.sha,
        }),
      });
    }
  }
} catch (err) {
  console.warn("Erreur mise à jour index.json (commentaires):", err);
}