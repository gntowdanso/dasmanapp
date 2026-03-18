const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');

async function testDraw() {
    const templateBytes = fs.readFileSync('public/mandateform/Digital DD Formv2.pdf');
    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    const { width, height } = firstPage.getSize();
    console.log(`Page Size: ${width} x ${height}`);

    const COORDS = {
        logo: { x: 45, y: 735, width: 130, height: 50 }, 
        customerName: { x: 159, y: 648, width: 220 },
        customerPhone: { x: 425, y: 648, width: 140 },
        ghanaCard: { x: 160, y: 625, width: 180 }, 
        date: { x: 450, y: 710, width: 120 },
        mandateRef: { x: 160, y: 710, width: 120 },
        loanBalance: { x: 160, y: 582, width: 140 }, 
        monthlyRepayment: { x: 420, y: 582, width: 140 },
        startDate: { x: 160, y: 558, width: 140 }, 
        noOfMonths: { x: 380, y: 558, width: 80 }, 
        account1: {
            bankName: { x: 100, y: 495, width: 180 },      
            branch: { x: 280, y: 495, width: 140 },        
            accountNumber: { x: 420, y: 495, width: 140 }, 
            accountName: { x: 100, y: 465, width: 280 },   
        },
        signature: { x: 100, y: 200, width: 150, height: 60 },
        signedDate: { x: 380, y: 220, width: 140 },
    };

    // Draw red rectangles over all our coords to visualize
    const drawRect = (c) => {
        firstPage.drawRectangle({
            x: c.x, y: c.y, width: c.width, height: c.height || 15,
            color: rgb(1, 0, 0), opacity: 0.5
        });
    };

    drawRect(COORDS.logo);
    drawRect(COORDS.customerName);
    drawRect(COORDS.customerPhone);
    drawRect(COORDS.ghanaCard);
    
    const outBytes = await pdfDoc.save();
    fs.writeFileSync('test_out.pdf', outBytes);
    console.log('Saved test_out.pdf');
}

testDraw().catch(console.error);