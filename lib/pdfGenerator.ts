import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Customer, DirectDebitMandate, DirectDebitAccount } from '@prisma/client';
import { decrypt } from './encryption';
import fs from 'fs';
import path from 'path';

// Coordinate configuration for the PDF template (origin is bottom-left)
// Adjust these values based on the "Digital DD Form.pdf" layout.
const COORDS = {
  // 1. Logo Position (Replaces 'COMPANY NAME AND LOGO')
  logo: { x: 40, y: 740, width: 120, height: 60 }, 

  // Customer Details
  customerName: { x: 140, y: 652 },
  customerPhone: { x: 400, y: 652 },
  ghanaCard: { x: 140, y: 628 }, // Adjusted slightly
  
  // Date and Ref
  date: { x: 460, y: 715 },
  mandateRef: { x: 140, y: 715 },

  // New Customer Fields (fill "....." placeholders)
  // Loan Amount / Balance - typically first line of financial details
  loanBalance: { x: 140, y: 585 }, 
  monthlyRepayment: { x: 400, y: 585 },
  
  // Duration details
  startDate: { x: 140, y: 562 }, // "commencing on _"
  noOfMonths: { x: 340, y: 562 }, // "ending on _" or "number of months"

  // Account 1 (Bank Details)
  account1: {
    bankName: { x: 85, y: 512 },
    branch: { x: 260, y: 512 },
    accountNumber: { x: 400, y: 512 },
    accountName: { x: 85, y: 485 }, // Account Name is often below or above
  },

  // Account 2 (filled if exists)
  account2: {
    bankName: { x: 85, y: 440 },
    branch: { x: 260, y: 440 },
    accountNumber: { x: 400, y: 440 },
    accountName: { x: 85, y: 410 },
  },

  signature: { x: 80, y: 200, width: 120, height: 60 },
  signedDate: { x: 380, y: 220 }, // Date next to signature
  
  meta: {
      generatedDate: { x: 480, y: 30 }
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
  
  // Format Date for Start Date
  const startD = mandate.customer.start_date ? new Date(mandate.customer.start_date).toLocaleDateString() : '';

  // Draw New Customer Fields (Filling placeholders)
  drawText(mandate.customer.loan_balance ? String(mandate.customer.loan_balance) : '', COORDS.loanBalance.x, COORDS.loanBalance.y);
  drawText(mandate.customer.monthly_repayment ? String(mandate.customer.monthly_repayment) : '', COORDS.monthlyRepayment.x, COORDS.monthlyRepayment.y);
  drawText(startD, COORDS.startDate.x, COORDS.startDate.y);
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
        
        // Scale signature
        const dims = embeddedImage.scale(0.5);
        // Ensure it fits within box
        const width = Math.min(dims.width, COORDS.signature.width);
        const height = Math.min(dims.height, COORDS.signature.height);

        firstPage.drawImage(embeddedImage, {
            x: COORDS.signature.x,
            y: COORDS.signature.y,
            width: width,
            height: height,
        });

        // Add Signature Date
        drawText(submissionDate, COORDS.signedDate.x, COORDS.signedDate.y);
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