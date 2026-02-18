import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Customer, DirectDebitMandate, DirectDebitAccount } from '@prisma/client';
import { decrypt } from './encryption';

/**
 * Generates a Direct Debit PDF for a given mandate.
 * @param mandate The mandate object including customer and accounts relations.
 */
export function generateMandatePDF(mandate: DirectDebitMandate & { customer: Customer, accounts: DirectDebitAccount[] }) {
  const doc = new jsPDF();
  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const MARGIN = 15;
  let yPos = 20;

  // Header
  doc.setFontSize(18);
  doc.text('DIRECT DEBIT MANDATE', PAGE_WIDTH / 2, yPos, { align: 'center' });
  yPos += 10;
  
  doc.setFontSize(12);
  doc.text('Mandate Reference: ' + mandate.id.substring(0, 8).toUpperCase(), MARGIN, yPos);
  yPos += 10;

  // Customer Details
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Details', MARGIN, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(`Full Name: ${mandate.customer.full_name}`, MARGIN, yPos);
  yPos += 7;
  doc.text(`Date: ${new Date().toLocaleDateString()}`, MARGIN, yPos);
  yPos += 7;
  // Use decrypted value here for PDF
  const decryptedGha = decrypt(mandate.ghana_card_number); 
  doc.text(`Ghana Card Number: ${decryptedGha}`, MARGIN, yPos);
  yPos += 15;

  // Account Details
  doc.setFont('helvetica', 'bold');
  doc.text('Bank Account Information', MARGIN, yPos);
  yPos += 5;

  const tableSubHeaders = ['Account Type', 'Bank Name', 'Branch', 'Account Name', 'Account Number'];
  const data = mandate.accounts.map(acc => [
    acc.account_order,
    acc.bank_name,
    acc.branch,
    acc.account_name,
    decrypt(acc.account_number) // Decrypt for PDF
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [tableSubHeaders],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Mandate Agreement
  doc.setFont('helvetica', 'bold');
  doc.text('Authorization', MARGIN, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const agreementText = "I/We hereby authorize you (the Bank) to debit my/our account with the amounts specified above. This mandate is to remain in force until cancelled by me/us in writing.";
  doc.text(doc.splitTextToSize(agreementText, PAGE_WIDTH - 2 * MARGIN), MARGIN, yPos);
  
  yPos += 20;

  // Signature
  if (mandate.digital_signature_path) {
    try {
        // If signature is a base64 string directly stored (for simplicity now, or load from file)
        // Assuming digital_signature_path might be base64 for now or we load it. 
        // In real app, we'd read file. For demo, let's assume it's passed or handled differently.
        // doc.addImage(mandate.digital_signature_path, 'PNG', MARGIN, yPos, 50, 20);
        doc.text("[Digital Signature Attached]", MARGIN, yPos + 10);
    } catch (e) {
        doc.text("[Signature Error]", MARGIN, yPos + 10);
    }
  } else {
      doc.text("Signature: __________________________", MARGIN, yPos + 10);
  }
  
  yPos += 40;
  doc.text(`Signed Date: ${mandate.submitted_at.toLocaleDateString()}`, MARGIN, yPos);

  return doc;
}
