import { PageContent } from './chunker';

/**
 * Extracts text page by page from an uploaded PDF File in the browser
 */
export async function extractTextFromPdfFile(file: File): Promise<PageContent[]> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    // Set worker from reliable CDN
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;

    const pages: PageContent[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (pageText) {
        pages.push({
          pageNumber: pageNum,
          text: pageText,
        });
      }
    }

    if (pages.length === 0) {
      throw new Error('No readable text found in PDF (might be a scanned image or protected document).');
    }

    return pages;
  } catch (err: any) {
    console.warn('PDF parsing with pdfjs-dist failed, falling back to simulated book reader:', err);
    throw new Error(err.message || 'Failed to parse PDF');
  }
}
