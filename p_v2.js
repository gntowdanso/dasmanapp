const fs = require('fs');
const PDFParser = require('pdf2json');
const pdfParser = new PDFParser();

pdfParser.on('pdfParser_dataError', errData => console.error(errData.parserError));
pdfParser.on('pdfParser_dataReady', pdfData => {
    const allPages = [];
    pdfData.Pages.forEach((page, index) => {
        const texts = [];
        page.Texts.forEach(t => {
            const textStr = decodeURIComponent(t.R[0].T);
            texts.push({ text: textStr, x: t.x, y: t.y, w: t.w });
        });
        allPages.push({ page: index, texts });
    });
    fs.writeFileSync('./v2_coords.json', JSON.stringify(allPages, null, 2));
    console.log('Extracted texts saved to v2_coords.json');
});
pdfParser.loadPDF('./public/mandateform/Digital DD Formv2.pdf');
