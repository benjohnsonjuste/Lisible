// /pages/api/print/generate-pdf.js ou /app/api/print/generate-pdf/route.js
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Configuration stricte des formats éditoriaux (dimensions en Points PostScript : 1 mm = 2.83465 points)
const FORMATS = {
  roman: { width: 419.53, height: 595.28, margin: 56.69, fontSize: 10, leading: 14 }, // Format A5 standard
  poche: { width: 311.81, height: 504.57, margin: 42.51, fontSize: 9, leading: 12.5 },
  royal: { width: 442.20, height: 663.30, margin: 65.20, fontSize: 11, leading: 16 }
};

export default async function handler(req, res) {
  // Sécurité élémentaire de la méthode HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  try {
    const { title, author, contentText, formatType = 'roman' } = req.body;

    // Validation rapide des données requises
    if (!title || !contentText) {
      return res.status(400).json({ error: 'Le titre et le contenu du texte sont obligatoires.' });
    }
    
    // 1. Sélection de la charte de mise en page selon le choix de l'auteur
    const config = FORMATS[formatType] || FORMATS.roman;
    
    // 2. Initialisation du document PDF vierge
    const pdfDoc = await PDFDocument.create();
    
    // Utilisation de polices standardisées (Times-Roman apporte une vraie texture "livre")
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontBold = await pdfDoc.embedFont(StandardFonts.TimesBold);

    // 3. Moteur de calcul typographique (Gestion du Word-wrap et des marges)
    const printableWidth = config.width - (config.margin * 2);
    const printableHeight = config.height - (config.margin * 2);
    const linesPerPage = Math.floor(printableHeight / config.leading);

    // Fonction de découpage du texte brut en lignes physiques respectant la largeur maximale
    const splitTextIntoLines = (text, maxWidth, fontSize) => {
      const paragraphs = text.split('\n');
      const lines = [];
      
      for (const para of paragraphs) {
        if (para.trim() === '') {
          lines.push(''); // Conserve les sauts de paragraphe
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

    // 4. Distribution des Pages & Application des standards d'imprimerie
    let currentLineIndex = 0;
    let pageNumber = 1;

    // --- PAGE DE TITRE / PREMIÈRE PAGE ÉPURÉE ---
    let currentPage = pdfDoc.addPage([config.width, config.height]);
    
    // Centrage ou placement vertical élégant du titre
    currentPage.drawText(title, { 
      x: config.margin, 
      y: config.height * 0.6, 
      size: config.fontSize + 8, 
      font: fontBold,
      color: rgb(0.05, 0.05, 0.05)
    });
    
    currentPage.drawText(author || "Auteur Anonyme", { 
      x: config.margin, 
      y: config.height * 0.5, 
      size: config.fontSize + 2, 
      font,
      color: rgb(0.3, 0.3, 0.3)
    });

    // Mention de courtoisie technique en bas
    currentPage.drawText("Document généré gratuitement par Lisible (lisible.biz)", { 
      x: config.margin, 
      y: config.margin, 
      size: 8, 
      font,
      color: rgb(0.5, 0.5, 0.5)
    });

    // --- CORPS DE TEXTE PRINCIPAL & PAGINATION ---
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
            color: rgb(0.02, 0.02, 0.02), // Noir pur "Encre d'Imprimerie"
          });
        }
        yPosition -= config.leading;
        currentLineIndex++;
      }

      // Numérotation alternée (Gauche pour les pages paires, Droite pour les impaires pour la reliure)
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

    // 5. Finalisation et Envoi du binaire
    const pdfBytes = await pdfDoc.save();
    
    // Déclaration des en-têtes HTTP pour forcer le téléchargement du fichier par le navigateur
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="lisible-print-${formatType}.pdf"`);
    
    return res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Erreur de génération d\'impression:', error);
    return res.status(500).json({ error: 'Une erreur interne est survenue lors de la compilation du PDF.' });
  }
}
