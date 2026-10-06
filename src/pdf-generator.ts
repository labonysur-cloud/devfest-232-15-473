import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { RequirementsData, UploadedFile, DocumentMatch } from './types';

export async function generatePackage(
  reqData: RequirementsData,
  files: UploadedFile[],
  matches: DocumentMatch[],
  signaturePngBase64?: string | null
): Promise<Uint8Array | null> {
  try {
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    // 1. Create Cover Page
    const coverPage = pdfDoc.addPage();
    const { height, width } = coverPage.getSize();
    let y = height - 50;

    const drawText = (text: string, font: any, size: number, color = rgb(0, 0, 0)) => {
      coverPage.drawText(text, { x: 50, y, size, font, color });
      y -= (size + 10);
    };

    drawText('TENDER DOCUMENT PACKAGE', timesRomanBold, 24);
    y -= 20;

    drawText(`Tender ID: ${reqData.tender.tender_id}`, timesRomanFont, 14);
    drawText(`Title: ${reqData.tender.title}`, timesRomanFont, 14);
    drawText(`Procuring Entity: ${reqData.tender.procuring_entity}`, timesRomanFont, 14);
    drawText(`Bidder: ${reqData.tender.bidder}`, timesRomanFont, 14);
    drawText(`Submission Deadline: ${reqData.tender.submission_deadline}`, timesRomanFont, 14);
    drawText(`Package Generated: ${new Date().toLocaleDateString()}`, timesRomanFont, 14);
    y -= 30;

    drawText('Included Documents:', timesRomanBold, 16);
    y -= 10;

    // Filter and sort matches based on requirement order
    const validMatches = reqData.requirements
      .map(req => {
        const match = matches.find(m => m.requirementId === req.id);
        const file = files.find(f => f.id === match?.fileId);
        return { req, file };
      })
      .filter(item => item.file !== undefined)
      .sort((a, b) => a.req.order - b.req.order);

    for (let i = 0; i < validMatches.length; i++) {
      const { req } = validMatches[i];
      drawText(`${i + 1}. ${req.title_en}`, timesRomanFont, 12);
    }

    // 2. Create Index Page
    const indexPage = pdfDoc.addPage();
    let indexY = height - 50;
    
    indexPage.drawText('INDEX', { x: 50, y: indexY, size: 24, font: timesRomanBold });
    indexY -= 40;
    
    indexPage.drawText('Document Name', { x: 50, y: indexY, size: 14, font: timesRomanBold });
    indexPage.drawText('Page Number', { x: width - 150, y: indexY, size: 14, font: timesRomanBold });
    indexY -= 20;

    // To keep track of where we draw the index info
    const indexEntries: { text: string; pageStr: string; yPos: number }[] = [];
    
    // We know cover page = page 1, index page = page 2.
    // The first document starts at page 3.
    let currentPagePointer = 3;

    // 3. Append matched documents
    for (const { req, file } of validMatches) {
      if (!file) continue;
      
      // Save index entry info
      indexEntries.push({
        text: `${req.order}. ${req.title_en}`,
        pageStr: currentPagePointer.toString(),
        yPos: indexY
      });
      indexY -= 20;

      const arrayBuffer = await file.file.arrayBuffer();
      const donorPdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await pdfDoc.copyPages(donorPdf, donorPdf.getPageIndices());
      
      copiedPages.forEach(page => {
        pdfDoc.addPage(page);
        currentPagePointer++;
      });
    }

    // Draw the index entries now that we know they are processed
    for (const entry of indexEntries) {
        indexPage.drawText(entry.text, { x: 50, y: entry.yPos, size: 12, font: timesRomanFont });
        indexPage.drawText(entry.pageStr, { x: width - 120, y: entry.yPos, size: 12, font: timesRomanFont });
    }

    let embeddedSignature: any = null;
    let sigDims: any = null;
    
    if (signaturePngBase64) {
      try {
        const pngImageBytes = Uint8Array.from(atob(signaturePngBase64.split(',')[1]), c => c.charCodeAt(0));
        embeddedSignature = await pdfDoc.embedPng(pngImageBytes);
        sigDims = embeddedSignature.scale(0.3); // Scale down the signature
      } catch (err) {
        console.error("Failed to embed signature:", err);
      }
    }

    // 4. Add footer and signature to every page (including cover and index)
    const totalPages = pdfDoc.getPageCount();
    for (let i = 0; i < totalPages; i++) {
      const page = pdfDoc.getPage(i);
      const { width: pWidth } = page.getSize();
      const footerText = `${reqData.tender.tender_id} | Page ${i + 1} of ${totalPages}`;
      const textWidth = timesRomanFont.widthOfTextAtSize(footerText, 10);
      
      // Draw a small white rectangle behind the text so it's readable over content
      page.drawRectangle({
        x: (pWidth / 2) - (textWidth / 2) - 5,
        y: 15,
        width: textWidth + 10,
        height: 15,
        color: rgb(1, 1, 1),
        opacity: 0.9
      });

      page.drawText(footerText, {
        x: pWidth / 2 - textWidth / 2,
        y: 20,
        size: 10,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });

      if (embeddedSignature && sigDims) {
        page.drawImage(embeddedSignature, {
          x: pWidth - sigDims.width - 20,
          y: 20,
          width: sigDims.width,
          height: sigDims.height,
        });
      }
    }

    return await pdfDoc.save();
  } catch (err) {
    console.error("PDF Generation Error:", err);
    return null;
  }
}
