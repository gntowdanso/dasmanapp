import * as pdfjsLib from "./node_modules/pdfjs-dist/legacy/build/pdf.mjs";

global.DOMMatrix = class DOMMatrix {
  constructor(a, b, c, d, e, f) {
    this.a = a || 1;
    this.b = b || 0;
    this.c = c || 0;
    this.d = d || 1;
    this.e = e || 0;
    this.f = f || 0;
  }
};

async function extractText() {
    const loadingTask = pdfjsLib.getDocument('./public/mandateform/Digital DD Formv2.pdf');
    const pdf = await loadingTask.promise;
    for(let pageNum=1; pageNum<=pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        console.log(`Page ${pageNum} Size: ${viewport.width} x ${viewport.height}`);
        
        const textContent = await page.getTextContent();
        for (const item of textContent.items) {
            const tx = item.transform[4];
            const ty = item.transform[5];
            const t = item.str.trim();
            if (t.length > 0) {
                if (t.includes('xxxx') || t.includes('COMPANY') || t.includes('___') || t.includes('....') || t.includes('Name:') || t.includes('ADDRESS')) {
                  console.log(`Page ${pageNum}: "${item.str}" at (${tx.toFixed(2)}, ${ty.toFixed(2)}) width: ${item.width.toFixed(2)} height: ${item.height.toFixed(2)}`);
                }
            }
        }
    }
}
extractText().catch(console.error);
