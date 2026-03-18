import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
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
        console.log(\Page \ Size: \ x \\);
        
        const textContent = await page.getTextContent();
        for (const item of textContent.items) {
            const tx = item.transform[4];
            const ty = item.transform[5];
            if (item.str.trim() && (item.str.includes('xxxxxxxxxxxxx') || item.str.includes('COMPANY NAME AND LOGO') || item.str.includes('___'))) {
                console.log(\Page \: "\" at (\, \) width: \ height: \\);
            }
        }
    }
}
extractText().catch(console.error);
