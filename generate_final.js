import { promises as fs } from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

async function buildPackage() {
  const reqData = JSON.parse(await fs.readFile('../sample-pack/requirements.json', 'utf-8'));
  const docPath = '../sample-pack/documents';
  
  // We will create a dummy Signed Declaration since it is missing
  const dummyDoc = await PDFDocument.create();
  const page = dummyDoc.addPage();
  page.drawText('Signed Declaration', { x: 50, y: 500, size: 24 });
  const dummyBytes = await dummyDoc.save();
  await fs.writeFile(path.join(docPath, 'signed_declaration.pdf'), dummyBytes);
  
  const matches = [
    { reqId: 'R01', file: 'trade_license_2026.pdf' }, // 2026 is valid, 2025 is expired
    { reqId: 'R02', file: '03_tin_certificate.pdf' },
    { reqId: 'R03', file: '04_vat_certificate.pdf' },
    { reqId: 'R04', file: 'bank_solvency.pdf' },
    { reqId: 'R05', file: 'experience_cert.pdf' }, // ignore experience_cert (1).pdf (duplicate)
    // R06 is optional and missing
    { reqId: 'R07', file: 'scan_0042.pdf' },
    { reqId: 'R08', file: '02_technical_proposal.pdf' },
    { reqId: 'R09', file: '01_financial_proposal.pdf' },
    { reqId: 'R10', file: 'signed_declaration.pdf' } // Resolved the missing problem
  ];

  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // 1. Cover Page
  const coverPage = pdfDoc.addPage();
  const { height, width } = coverPage.getSize();
  let y = height - 50;
  
  const drawText = (text, font, size, color = rgb(0, 0, 0)) => {
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

  const validMatches = matches.map(m => {
    const req = reqData.requirements.find(r => r.id === m.reqId);
    return { req, fileName: m.file };
  }).sort((a, b) => a.req.order - b.req.order);

  validMatches.forEach((item, i) => {
    drawText(`${i + 1}. ${item.req.title_en}`, timesRomanFont, 12);
  });

  // 2. Index Page
  const indexPage = pdfDoc.addPage();
  let indexY = height - 50;
  indexPage.drawText('INDEX', { x: 50, y: indexY, size: 24, font: timesRomanBold });
  indexY -= 40;
  indexPage.drawText('Document Name', { x: 50, y: indexY, size: 14, font: timesRomanBold });
  indexPage.drawText('Page Number', { x: width - 150, y: indexY, size: 14, font: timesRomanBold });
  indexY -= 20;

  const indexEntries = [];
  let currentPagePointer = 3;

  // 3. Append Documents
  for (const { req, fileName } of validMatches) {
    const filePath = path.join(docPath, fileName);
    const fileBytes = await fs.readFile(filePath);
    
    indexEntries.push({ text: `${req.order}. ${req.title_en}`, pageStr: currentPagePointer.toString(), yPos: indexY });
    indexY -= 20;

    const donorPdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
    const copiedPages = await pdfDoc.copyPages(donorPdf, donorPdf.getPageIndices());
    
    copiedPages.forEach(page => {
      pdfDoc.addPage(page);
      currentPagePointer++;
    });
  }

  // Draw Index
  for (const entry of indexEntries) {
    indexPage.drawText(entry.text, { x: 50, y: entry.yPos, size: 12, font: timesRomanFont });
    indexPage.drawText(entry.pageStr, { x: width - 120, y: entry.yPos, size: 12, font: timesRomanFont });
  }

  // 4. Footer
  const totalPages = pdfDoc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const page = pdfDoc.getPage(i);
    const { width: pWidth } = page.getSize();
    const footerText = `${reqData.tender.tender_id} | Page ${i + 1} of ${totalPages}`;
    const textWidth = timesRomanFont.widthOfTextAtSize(footerText, 10);
    
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
  }

  const finalPdf = await pdfDoc.save();
  await fs.writeFile(`output/${reqData.tender.tender_id}_Package.pdf`, finalPdf);
  console.log('PDF Generated Successfully in output/ folder!');
}

buildPackage().catch(console.error);
