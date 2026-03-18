import * as pdfjsLib from "./node_modules/pdfjs-dist/legacy/build/pdf.mjs";

global.DOMMatrix = class DOMMatrix {
  constructor(a,b,c,d,e,f) { this.a=a||1; this.b=b||0; this.c=c||0; this.d=d||1; this.e=e||0; this.f=f||0; }
};

async function dump() {
    const loadingTask = pdfjsLib.getDocument('./public/mandateform/Digital DD Formv2.pdf');
    const pdf = await loadingTask.promise;
    for(let pageNum=1; pageNum<=pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        for(let i=0; i<textContent.items.length; i++) {
           const item = textContent.items[i];
           if (item.str.trim() && item.str.trim() !== "LG - Public") {
               console.log(`Page ${pageNum}: "${item.str}" at (${item.transform[4].toFixed(2)}, ${item.transform[5].toFixed(2)}) w: ${item.width.toFixed(2)} h: ${item.height.toFixed(2)}`);
           }
        }
    }
}
dump().catch(console.error);
