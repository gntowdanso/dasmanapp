const fs = require('fs');
const PDFParser = require('pdf2json');

const pdfParser = new PDFParser();

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    const texts = [];
    const page = pdfData.Pages[0];
    
    page.Texts.forEach(t => {
        const textStr = decodeURIComponent(t.R[0].T);
        texts.push({
            text: textStr,
            x: t.x,
            y: t.y,
            w: t.w,
            sw: t.sw,
            clr: t.clr
        });
    });

    fs.writeFileSync('./pdf_coords.json', JSON.stringify(texts, null, 2));
    console.log("Extracted texts saved to pdf_coords.json");
});

pdfParser.loadPDF("./public/mandateform/Digital DD Form.pdf");