import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Customer, DirectDebitMandate, DirectDebitAccount } from '@prisma/client';
import { decrypt } from './encryption';
import fs from 'fs';
import path from 'path';

// Coordinate configuration for the PDF template (origin is bottom-left)
// Adjust these values based on the "Digital DD Form.pdf" layout.
const COORDS = {
  // Logo: covers "COMPANY NAME AND LOGO" on Page 1
  logo: { page: 0, x: 74, y: 720, width: 250, height: 35 }, 

  // Page 1 Customer Details
  customerName: { page: 0, x: 123, y: 606, wipeX: 120, wipeWidth: 250, wipeHeight: 15, wipeYOffset: -2 },
  customerPhone: { page: 0, x: 108, y: 583, wipeX: 103, wipeWidth: 200, wipeHeight: 15, wipeYOffset: -2 },
  ghanaCard: { page: 0, x: 173, y: 561, wipeX: 168, wipeWidth: 250, wipeHeight: 15, wipeYOffset: -2 }, 

  // Additional stats manually added
  loanBalance: { page: 0, x: 175, y: 480,wipeX: 176, wipeWidth: 60 ,wipeHeight: 15, wipeYOffset: -2}, 
  monthlyRepayment: { page: 0, x: 500, y: 480, wipeX: 502, wipeWidth: 60 ,wipeHeight: 15, wipeYOffset: -2},
  startDate: { page: 0, x: 245, y: 450, wipeX: 245, wipeWidth: 38 ,wipeHeight: 15, wipeYOffset: -2}, 
  noOfMonths: { page: 0, x: 412, y: 450, wipeX: 414, wipeWidth: 12 ,wipeHeight: 15, wipeYOffset: -2}, 
  date: { page: 0, x: 455, y: 710, wipeX: 455, wipeWidth: 120 ,wipeHeight: 15, wipeYOffset: -2},
  mandateRef: { page: 0, x: 165, y: 710, wipeX: 165, wipeWidth: 120 ,wipeHeight: 15, wipeYOffset: -2},

  // Page 1 Accounts (Drawing over whatever table is there)
  account1: {
    page: 0,
    accountName: { x: 72, y: 160, wipeX: 72, wipeWidth: 100, wipeHeight: 15, wipeYOffset: -2 },
    accountNumber: { x: 287, y: 160, wipeX: 287, wipeWidth: 80, wipeHeight: 15, wipeYOffset: -2 },
    branch: { x: 432  , y: 160, wipeX: 432, wipeWidth: 100, wipeHeight: 15, wipeYOffset: -2 },
  },
  account2: {
    page: 0,
    accountName: { x: 72, y: 138, wipeX: 72, wipeWidth: 100, wipeHeight: 15, wipeYOffset: -2 },
    accountNumber: { x: 287, y: 138, wipeX: 287 , wipeWidth: 60, wipeHeight: 15, wipeYOffset: -2 },
    branch: { x: 432, y: 138, wipeX: 432, wipeWidth: 100, wipeHeight: 15, wipeYOffset: -2 },
  },

  // Page 2 Signatures ("SIGNATURE AND DATE" is at y=468)
  signature: { page: 1, x: 72, y: 425, width: 80, height: 35, wipeX: 70, wipeWidth: 80, wipeHeight: 20, wipeYOffset: 15 },
  signedDate: { page: 1, x: 150, y: 445, wipeX: 145, wipeWidth: 100, wipeHeight: 15, wipeYOffset: -2 },
  ipAddress: { page: 1, x: 72, y: 400, wipeX: 70, wipeWidth: 250, wipeHeight: 15, wipeYOffset: -2 }
};

/**
 * Generates a Direct Debit PDF using the "Digital DD Formv2.pdf" template.
 * @param mandate The mandate object including customer and accounts relations.
 */
export async function generateMandatePDF(mandate: DirectDebitMandate & { customer: Customer, accounts: DirectDebitAccount[] }): Promise<Uint8Array> {
  // Load the template
  const templateRelPath = 'mandateform/Digital DD Formv2.pdf';
  const logoRelPath = 'logo/logo_0.png';
  
  let templateBytes = await getAssetBuffer(templateRelPath);
  
  if (!templateBytes) {
    throw new Error(`PDF Template not found: ${templateRelPath}`);
  }

  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();
  const page1 = pages[0];
  const page2 = pages.length > 1 ? pages[1] : pages[0]; // Fallback if only 1 page
  
  // Embed font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 10;
  const color = rgb(0, 0, 0); // Black

  // Embed Logo
  let logoBytes = await getAssetBuffer(logoRelPath);
  
  // Always draw white rectangle to cover placeholders like 'COMPANY NAME AND LOGO'
  page1.drawRectangle({
    x: COORDS.logo.x,
    y: COORDS.logo.y,
    width: COORDS.logo.width,
    height: COORDS.logo.height,
    color: rgb(1, 1, 1), // White
  });

  if (logoBytes) {
      const logoImage = await pdfDoc.embedPng(logoBytes); 
      page1.drawImage(logoImage, {
        x: COORDS.logo.x + 10,
        y: COORDS.logo.y,
        width: 130, // Original logo width
        height: 50, // Original logo height
      });
  }

  // Helper to draw text with optional white background to cover placeholders
  const drawText = (text: string | null | undefined, config: any) => {
    const targetPage = config.page === 1 ? page2 : page1;
    
    // If wipe width is provided, draw a white rectangle to cover underlying placeholder
    if (config.wipeWidth) {
        targetPage.drawRectangle({
            x: config.wipeX || config.x,
            y: config.y + (config.wipeYOffset || 0) - 2, 
            width: config.wipeWidth,
            height: config.wipeHeight || (fontSize + 6),
            color: rgb(1, 1, 1), 
        });
    }

    if (!text) return;
    targetPage.drawText(String(text), { x: config.x, y: config.y, size: fontSize, font, color });
  };

  // Draw Customer Details
  drawText(mandate.customer.full_name, COORDS.customerName);
  drawText(mandate.customer.phone_number, COORDS.customerPhone);
  
  // Format Date for Start Date
  const startD = mandate.customer.start_date ? new Date(mandate.customer.start_date).toLocaleDateString() : '';

  // Draw New Customer Fields
  drawText(mandate.customer.loan_balance ? String(mandate.customer.loan_balance) : '', COORDS.loanBalance);
  drawText(mandate.customer.monthly_repayment ? String(mandate.customer.monthly_repayment) : '', COORDS.monthlyRepayment);
  drawText(startD, COORDS.startDate);
  drawText(mandate.customer.no_of_months ? String(mandate.customer.no_of_months) : '', COORDS.noOfMonths);

  // Decrypt Ghana Card
  const decryptedGha = decrypt(mandate.ghana_card_number);
  drawText(decryptedGha, COORDS.ghanaCard);

  // Draw Meta Info
  const submissionDate = mandate.submitted_at ? new Date(mandate.submitted_at).toLocaleDateString() : new Date().toLocaleDateString();
  drawText(submissionDate, COORDS.date);
  drawText(mandate.id.substring(0, 8).toUpperCase(), COORDS.mandateRef);

  // Draw Account Details
  if (mandate.accounts.length > 0) {
    const acc1 = mandate.accounts[0];
    drawText(acc1.account_name, COORDS.account1.accountName);
    drawText(decrypt(acc1.account_number), COORDS.account1.accountNumber);
    drawText(acc1.branch, COORDS.account1.branch);
  }

  if (mandate.accounts.length > 1) {
    const acc2 = mandate.accounts[1];
    drawText(acc2.account_name, COORDS.account2.accountName);
    drawText(decrypt(acc2.account_number), COORDS.account2.accountNumber);
    drawText(acc2.branch, COORDS.account2.branch);
  }

  // Draw Signature
  const sigPage = COORDS.signature.page === 1 ? page2 : page1;
  if (mandate.digital_signature_path) {
    try {
      let imageBytes: Uint8Array | undefined;
      let format: 'png' | 'jpg' | undefined;

      // Draw white rectangle to clear signature area
      if (COORDS.signature.wipeWidth) {
        sigPage.drawRectangle({
            x: COORDS.signature.wipeX || COORDS.signature.x,
            y: COORDS.signature.y + (COORDS.signature.wipeYOffset || 0) - 10,
            width: COORDS.signature.wipeWidth,
            height: COORDS.signature.wipeHeight || COORDS.signature.height,
            color: rgb(1, 1, 1), 
        });
      }

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

        sigPage.drawImage(embeddedImage, {
            x: COORDS.signature.x,
            y: COORDS.signature.y,
            width: width,
            height: height,
        });

        // Add Signature Date
        drawText(submissionDate, COORDS.signedDate);
      } else {
        drawText("[Signature Image Not Found]", COORDS.signature);
      }
    } catch (e) {
      console.error("Error embedding signature:", e);
      drawText("[Error embedding signature]", COORDS.signature);
    }
  } else {
      // No digital signature
      drawText("__________________________", COORDS.signature);
  }

  // Draw Metadata
  drawText(`Signed Date: ${submissionDate}`, COORDS.signedDate);
  //drawText(`IP: ${mandate.ip_address || 'N/A'}`, COORDS.ipAddress);

  return await pdfDoc.save();
}

async function getAssetBuffer(relativePath: string): Promise<Uint8Array | null> {
  const localPath = path.join(process.cwd(), 'public', relativePath);
  
  // Try local file system first
  if (fs.existsSync(localPath)) {
    return fs.readFileSync(localPath);
  }

  console.log(`[PDF] Asset not found at: ${localPath}. CWD: ${process.cwd()}`);

  // Try alternate path (root)
  const altPath = path.join(process.cwd(), relativePath);
  if (fs.existsSync(altPath)) {
     console.log(`[PDF] Found asset at: ${altPath}`);
     return fs.readFileSync(altPath);
  }

  // Fallback to fetch from URL
  try {
    let baseUrl = process.env.SMS_DASMAN_SEND_URL;
    
    if (!baseUrl) {
      if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else {
        baseUrl = 'http://localhost:3000';
      }
    }

    baseUrl = baseUrl.replace(/\/$/, '');
    
    const encodedPath = relativePath.split('/').map(part => encodeURIComponent(part)).join('/');
    const assetUrl = `${baseUrl}/${encodedPath}`;

    console.log(`Fetching asset from: ${assetUrl}`);
    
    const response = await fetch(assetUrl);
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    }
    console.warn(`Failed to fetch asset ${assetUrl}: ${response.status} ${response.statusText}`);
  } catch (e: any) {
    console.error(`Error fetching asset ${relativePath}:`, e);
  }
  return null;
}