import { PDFDocument } from 'pdf-lib';

export async function processPdfFile(file: File): Promise<{ pageCount: number, hash: string } | null> {
  if (file.type !== 'application/pdf') {
    return null;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Calculate SHA-256 hash for duplicate detection
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Load PDF to get page count
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();

    return { pageCount, hash: hashHex };
  } catch (error) {
    console.error("Failed to process PDF:", error);
    return null;
  }
}
