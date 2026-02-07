// app/api/followers-count/route.js
import { getFile } from "@/lib/github";
import { Buffer } from "buffer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const authorId = searchParams.get("authorId");

    if (!authorId) {
      return new Response(JSON.stringify({ error: "ID auteur manquant." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sécurité : Si l'ID contient un "@", on le transforme en Base64 automatiquement
    let fileName = authorId;
    if (authorId.includes("@")) {
      fileName = Buffer.from(authorId.toLowerCase().trim()).toString("base64").replace(/=/g, "");
    }

    const path = `data/users/${fileName}.json`;
    
    // On force la récupération fraîche (no-store) pour éviter le cache serveur de Next.js
    const userFile = await getFile(path);

    if (!userFile) {
      return new Response(JSON.stringify({ followersCount: 0 }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate"
        },
      });
    }

    // On compte soit la longueur du tableau subscribers, soit la valeur numérique
    const subscribers = userFile.content.subscribers;
    const count = Array.isArray(subscribers) ? subscribers.length : (parseInt(subscribers) || 0);
    
    return new Response(JSON.stringify({ followersCount: count }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate"
      },
    });

  } catch (error) {
    console.error("Erreur Count:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
