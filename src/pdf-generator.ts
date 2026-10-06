import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { RequirementsData, UploadedFile, DocumentMatch } from './types';

export async function generatePackage(
  reqData: RequirementsData,
  files: UploadedFile[],
  matches: DocumentMatch[]
): Promise<Uint8Array | null> {
  try {
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    // 1. Create Cover Page
    const coverPage = pdfDoc.addPage();
    const { width, height } = coverPage.getSize();
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

    // 2. Append matched documents
    for (const { file } of validMatches) {
      if (!file) continue;
      const arrayBuffer = await file.file.arrayBuffer();
      const donorPdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await pdfDoc.copyPages(donorPdf, donorPdf.getPageIndices());
      copiedPages.forEach(page => pdfDoc.addPage(page));
    }

    // 3. Add footer to every page (including cover)
    const totalPages = pdfDoc.getPageCount();
    for (let i = 0; i < totalPages; i++) {
      const page = pdfDoc.getPage(i);
      const { width } = page.getSize();
      const footerText = `${reqData.tender.tender_id} | Page ${i + 1} of ${totalPages}`;
      const textWidth = timesRomanFont.widthOfTextAtSize(footerText, 10);
      
      // Draw a small white rectangle behind the text so it's readable over content
      page.drawRectangle({
        x: (width / 2) - (textWidth / 2) - 5,
        y: 15,
        width: textWidth + 10,
        height: 15,
        color: rgb(1, 1, 1),
        opacity: 0.8
      });

      page.drawText(footerText, {
        x: width / 2 - textWidth / 2,
        y: 20,
        size: 10,
        font: timesRomanFont,
        color: rgb(0, 0, 0),
      });
    }

    return await pdfDoc.save();
  } catch (err) {
    console.error("PDF Generation Error:", err);
    return null;
  }
}
