import { PDFDocument } from 'pdf-lib';

export class PdfMergerUtil {
  static async mergePDFs(...blobs: Blob[]): Promise<Blob> {
    try {
      if (blobs.length === 0) {
        throw new Error('Nenhum PDF fornecido para mesclagem');
      }

      if (blobs.length === 1) {
        return blobs[0]; 
      }
      const mergedPdf = await PDFDocument.create();
      for (let i = 0; i < blobs.length; i++) {
        const blob = blobs[i];
        const arrayBuffer = await blob.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      const uint8Array = Uint8Array.from(pdfBytes);
      return new Blob([uint8Array], { type: 'application/pdf' });

    } catch (error) {
      console.error(' Erro ao mesclar PDFs:', error);
      throw new Error('Falha ao mesclar PDFs: ' + (error as Error).message);
    }
  }
  
  static async mergeTwoPDFs(blob1: Blob, blob2: Blob): Promise<Blob> {
    return this.mergePDFs(blob1, blob2);
  }
}