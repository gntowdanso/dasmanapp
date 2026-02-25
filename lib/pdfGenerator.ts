import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Customer, DirectDebitMandate, DirectDebitAccount } from '@prisma/client';
import { decrypt } from './encryption';
import fs from 'fs';
import path from 'path';

// Coordinate configuration for the PDF template (origin is bottom-left)
// Adjust these values based on the "Digital DD Form.pdf" layout.
const COORDS = {
  logo: { x: 50, y: 750, width: 100, height: 40 }, // Replace 'COMPANY NAME AND LOGO' position
  
  customerName: { x: 150, y: 650 },
  customerPhone: { x: 400, y: 650 },
  ghanaCard: { x: 150, y: 620 },
  date: { x: 450, y: 720 },
  mandateRef: { x: 150, y: 720 },

  // New Customer Fields (fill "....." placeholders)
  // Adjust these coordinates to match the form lines
  loanBalance: { x: 150, y: 580 },
  monthlyRepayment: { x: 400, y: 580 },
  startDate: { x: 150, y: 560 }, // "commencing on _"
  noOfMonths: { x: 400, y: 560 }, // "ending on _" or "number of months"

  // Account 1
  account1: {
    bankName: { x: 80, y: 540 },
    branch: { x: 250, y: 540 },
    accountNumber: { x: 400, y: 540 },
    accountName: { x: 80, y: 510 },
  },

  // Account 2 (if supported by template)
  account2: {
    bankName: { x: 80, y: 470 },
    branch: { x: 250, y: 470 },
    accountNumber: { x: 400, y: 470 },
    accountName: { x: 80, y: 440 },
  },

  signature: { x: 100, y: 200, width: 100, height: 50 },
  signedDate: { x: 100, y: 150 },
  ipAddress: { x: 400, y: 150 },
  
  meta: {
      generatedDate: { x: 480, y: 50 }
  }
};

/**
 * Generates a Direct Debit PDF using the "Digital DD Form.pdf" template.
 * @param mandate The mandate object including customer and accounts relations.
 */
export async function generateMandatePDF(mandate: DirectDebitMandate & { customer: Customer, accounts: DirectDebitAccount[] }): Promise<Uint8Array> {
  // Load the template
  const templatePath = path.join(process.cwd(), 'public/mandateform/Digital DD Form.pdf');
  const logoPath = path.join(process.cwd(), 'public/logo/logo_0.png');
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`PDF Template not found at: ${templatePath}`);
  }

  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  
  // Embed font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 10;
  const color = rgb(0, 0, 0); // Black

  // Embed Logo
  if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes); // Assuming PNG based on filename
      firstPage.drawImage(logoImage, {
        x: COORDS.logo.x,
        y: COORDS.logo.y,
        width: COORDS.logo.width,
        height: COORDS.logo.height,
      });
  }

  // Helper to draw text
  const drawText = (text: string | null | undefined, x: number, y: number) => {
    if (!text) return;
    firstPage.drawText(String(text), { x, y, size: fontSize, font, color });
  };

  // Draw Customer Details
  drawText(mandate.customer.full_name, COORDS.customerName.x, COORDS.customerName.y);
  drawText(mandate.customer.phone_number, COORDS.customerPhone.x, COORDS.customerPhone.y);
  
  // Draw New Customer Fields
  drawText(mandate.customer.loan_balance, COORDS.loanBalance.x, COORDS.loanBalance.y);
  drawText(mandate.customer.monthly_repayment, COORDS.monthlyRepayment.x, COORDS.monthlyRepayment.y);
  drawText(mandate.customer.start_date ? new Date(mandate.customer.start_date).toLocaleDateString() : '', COORDS.startDate.x, COORDS.startDate.y);
  drawText(mandate.customer.no_of_months ? String(mandate.customer.no_of_months) : '', COORDS.noOfMonths.x, COORDS.noOfMonths.y);
  
  // Decrypt Ghana Card
  const decryptedGha = decrypt(mandate.ghana_card_number);
  drawText(decryptedGha, COORDS.ghanaCard.x, COORDS.ghanaCard.y);

  // Draw Meta Info
  const submissionDate = mandate.submitted_at ? new Date(mandate.submitted_at).toLocaleDateString() : new Date().toLocaleDateString();
  drawText(submissionDate, COORDS.date.x, COORDS.date.y);
  drawText(mandate.id.substring(0, 8).toUpperCase(), COORDS.mandateRef.x, COORDS.mandateRef.y);

  // Draw Account Details (Support up to 2 accounts for now based on template guess)
  if (mandate.accounts.length > 0) {
    const acc1 = mandate.accounts[0];
    drawText(acc1.bank_name, COORDS.account1.bankName.x, COORDS.account1.bankName.y);
    drawText(acc1.branch, COORDS.account1.branch.x, COORDS.account1.branch.y);
    drawText(decrypt(acc1.account_number), COORDS.account1.accountNumber.x, COORDS.account1.accountNumber.y); // Decrypt account number
    drawText(acc1.account_name, COORDS.account1.accountName.x, COORDS.account1.accountName.y);
  }

  if (mandate.accounts.length > 1) {
    const acc2 = mandate.accounts[1];
    drawText(acc2.bank_name, COORDS.account2.bankName.x, COORDS.account2.bankName.y);
    drawText(acc2.branch, COORDS.account2.branch.x, COORDS.account2.branch.y);
    drawText(decrypt(acc2.account_number), COORDS.account2.accountNumber.x, COORDS.account2.accountNumber.y); // Decrypt account number
    drawText(acc2.account_name, COORDS.account2.accountName.x, COORDS.account2.accountName.y);
  }

  // Draw Signature
  if (mandate.digital_signature_path) {
    try {
      let imageBytes: Uint8Array | undefined;
      let format: 'png' | 'jpg' | undefined;

      if (mandate.digital_signature_path.startsWith('data:image/png;base64,')) {
        const base64Data = mandate.digital_signature_path.replace('data:image/png;base64,', '');
        imageBytes = Buffer.from(base64Data, 'base64');
        format = 'png';
      } else if (mandate.digital_signature_path.startsWith('data:image/jpeg;base64,')) {
         const base64Data = mandate.digital_signature_path.replace('data:image/jpeg;base64,', '');
         imageBytes = Buffer.from(base64Data, 'base64');
         format = 'jpg';
      } else if (fs.existsSync(mandate.digital_signature_path)) {
          // It's a file path
          imageBytes = fs.readFileSync(mandate.digital_signature_path);
          if (mandate.digital_signature_path.endsWith('.png')) format = 'png';
          if (mandate.digital_signature_path.endsWith('.jpg') || mandate.digital_signature_path.endsWith('.jpeg')) format = 'jpg';
      }

      if (imageBytes && format) {
        let embeddedImage;
        if (format === 'png') {
            embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else {
            embeddedImage = await pdfDoc.embedJpg(imageBytes);
        }
        
        firstPage.drawImage(embeddedImage, {
            x: COORDS.signature.x,
            y: COORDS.signature.y,
            width: COORDS.signature.width,
            height: COORDS.signature.height,
        });
      } else {
        drawText("[Signature Image Not Found]", COORDS.signature.x, COORDS.signature.y);
      }
    } catch (e) {
      console.error("Error embedding signature:", e);
      drawText("[Error embedding signature]", COORDS.signature.x, COORDS.signature.y);
    }
  } else {
      // No digital signature
      drawText("__________________________", COORDS.signature.x, COORDS.signature.y);
  }

  // Draw Metadata
  drawText(`Signed Date: ${submissionDate}`, COORDS.signedDate.x, COORDS.signedDate.y);
  drawText(`IP: ${mandate.ip_address || 'N/A'}`, COORDS.ipAddress.x, COORDS.ipAddress.y);

  return await pdfDoc.save();
}