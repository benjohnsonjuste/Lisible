import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    const { title, content, authorName } = await req.json();

    if (!title || !content || !authorName) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(dataDir, "texts.json");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    let texts = [];
    if (fs.existsSync(filePath)) {
      texts = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    const newText = {
      id: Date.now(),
      title,
      content,
      authorName,
      createdAt: new Date().toISOString()
    };

    texts.unshift(newText);
    fs.writeFileSync(filePath, JSON.stringify(texts, null, 2));

    return NextResponse.json(
      { success: true, text: newText },
      { status: 200 }
    );

  } catch (err) {
    console.error("❌ API ERROR /api/texts:", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}