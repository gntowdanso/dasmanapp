const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function extractText() {
    const loadingTask = pdfjsLib.getDocument('./public/mandateform/Digital DD Form.pdf');
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    
    // The viewport will give us the dimensions (points)
    const viewport = page.getViewport({ scale: 1.0 });
    console.log(`Page Size: ${viewport.width} x ${viewport.height}`);

    const textContent = await page.getTextContent();
    for (const item of textContent.items) {
        // item.transform is [scaleX, skewY, skewX, scaleY, tx, ty]
        // tx, ty is the bottom-left coordinate
        const tx = item.transform[4];
        const ty = item.transform[5];
        console.log(`"${item.str}" at (${tx.toFixed(2)}, ${ty.toFixed(2)}) width: ${item.width.toFixed(2)} height: ${item.height.toFixed(2)}`);
    }
}

extractText().catch(console.error);