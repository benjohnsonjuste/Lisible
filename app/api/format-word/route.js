import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { textChunk } = await request.json();
    if (!textChunk) return NextResponse.json({ error: "Aucun texte fourni" }, { status: 400 });

    // Formatage typographique canonique appliqué côté serveur
    let formatted = textChunk
      .replace(/\s*([:;!?])\s*/g, " $1 ") // Équilibrage des espaces autour des ponctuations doubles
      .replace(/ {2,}/g, " ")             // Suppression des doubles espaces
      .replace(/^([A-ZÀ-Ö])/gm, "\t$1");   // Retrait d'alinéa systématique en début de paragraphe

    // Simulation d'une structure de fichier Word HTML compatible .doc imprimable
    const docHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 2.0; margin: 2.5cm 2.5cm 2.5cm 2.5cm; }
        p { text-align: justify; text-indent: 1.25cm; margin-bottom: 0px; }
      </style></head>
      <body>${formatted.split('\n').map(p => `<p>${p.trim()}</p>`).join('')}</body>
      </html>
    `;

    return new NextResponse(docHtml, {
      status: 200,
      headers: {
        'Content-Type': 'application/msword',
        'Content-Disposition': 'attachment; filename=manuscrit_edition_pro.doc',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Erreur d'ingénierie du document." }, { status: 500 });
  }
}
