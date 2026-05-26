import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Activation du Edge Runtime pour éviter les plantages ou timeouts sur les longs manuscrits
export const runtime = 'edge';

const FORMATS = {
  roman: { width: 419.53, height: 595.28, margin: 56.69, fontSize: 10, leading: 14 },
  poche: { width: 311.81, height: 504.57, margin: 42.51, fontSize: 9, leading: 12.5 },
  royal: { width: 442.20, height: 663.30, margin: 65.20, fontSize: 11, leading: 16 }
};

export async function POST(req) {
  try {
    const { title, author, contentText, formatType = 'roman' } = await req.json();

    if (!title || !contentText) {
      return NextResponse.json({ error: 'Le titre et le contenu sont obligatoires.' }, { status: 400 });
    }

    const config = FORMATS[formatType] || FORMATS.roman;
    const pdfDoc = await PDFDocument.create();
    
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontBold = await pdfDoc.embedFont(StandardFonts.TimesBold);

    const printableWidth = config.width - (config.margin * 2);
    const printableHeight = config.height - (config.margin * 2);
    const linesPerPage = Math.floor(printableHeight / config.leading);

    const splitTextIntoLines = (text, maxWidth, fontSize) => {
      const paragraphs = text.split('\n');
      const lines = [];
      
      for (const para of paragraphs) {
        if (para.trim() === '') {
          lines.push('');
          continue;
        }
        const words = para.split(' ');
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);
          
          if (textWidth > maxWidth) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);
      }
      return lines;
    };

    const allLines = splitTextIntoLines(contentText, printableWidth, config.fontSize);
    let currentLineIndex = 0;
    let pageNumber = 1;

    // --- PAGE DE TITRE ---
    let currentPage = pdfDoc.addPage([config.width, config.height]);
    currentPage.drawText(title, { x: config.margin, y: config.height * 0.6, size: config.fontSize + 8, font: fontBold });
    currentPage.drawText(author || "Auteur Lisible", { x: config.margin, y: config.height * 0.5, size: config.fontSize + 2, font });
    currentPage.drawText("Document généré gratuitement par Lisible", { x: config.margin, y: config.margin, size: 8, font, color: rgb(0.5, 0.5, 0.5) });

    // --- CORPS DE TEXTE ---
    while (currentLineIndex < allLines.length) {
      pageNumber++;
      currentPage = pdfDoc.addPage([config.width, config.height]);
      let yPosition = config.height - config.margin;

      for (let i = 0; i < linesPerPage; i++) {
        if (currentLineIndex >= allLines.length) break;
        
        const lineText = allLines[currentLineIndex];
        if (lineText !== '') {
          currentPage.drawText(lineText, {
            x: config.margin,
            y: yPosition,
            size: config.fontSize,
            font,
            color: rgb(0.02, 0.02, 0.02),
          });
        }
        yPosition -= config.leading;
        currentLineIndex++;
      }

      // Pagination alternée
      const isEven = pageNumber % 2 === 0;
      const pageNumStr = pageNumber.toString();
      const numWidth = font.widthOfTextAtSize(pageNumStr, 8);
      const xNum = isEven ? config.margin : config.width - config.margin - numWidth;

      currentPage.drawText(pageNumStr, {
        x: xNum,
        y: config.margin - 18,
        size: 8,
        font,
        color: rgb(0.4, 0.4, 0.4)
      });
    }

    const pdfBytes = await pdfDoc.save();

    // Renvoi du fichier binaire avec les en-têtes de téléchargement adaptés à l'App Router
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="lisible-print-${formatType}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Erreur backend:', error);
    return NextResponse.json({ error: 'Une erreur est survenue.' }, { status: 500 });
  }
}
