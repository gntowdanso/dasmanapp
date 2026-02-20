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
  let yPos = 15;

  // Letshego Green Header Bar
  doc.setFillColor(0, 166, 81); // #00A651
  doc.rect(0, 0, PAGE_WIDTH, 8, 'F');

  // Company Name
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 166, 81);
  doc.text('Letshego', MARGIN, yPos + 8);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('GHANA', MARGIN + 62, yPos + 8);

  yPos += 18;

  // Title
  doc.setFontSize(16);
  doc.setTextColor(33, 33, 33);
  doc.text('DIRECT DEBIT MANDATE', PAGE_WIDTH / 2, yPos, { align: 'center' });
  yPos += 8;

  // Divider line
  doc.setDrawColor(0, 166, 81);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('Mandate Reference: ' + mandate.id.substring(0, 8).toUpperCase(), MARGIN, yPos);
  doc.text('Date: ' + (mandate.submitted_at ? new Date(mandate.submitted_at).toLocaleDateString() : new Date().toLocaleDateString()), PAGE_WIDTH - MARGIN, yPos, { align: 'right' });
  yPos += 12;

  // Customer Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 166, 81);
  doc.text('Customer Details', MARGIN, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(33, 33, 33);
  doc.text(`Full Name: ${mandate.customer.full_name}`, MARGIN, yPos);
  yPos += 6;
  doc.text(`Phone: ${mandate.customer.phone_number}`, MARGIN, yPos);
  yPos += 6;
  const decryptedGha = decrypt(mandate.ghana_card_number); 
  doc.text(`Ghana Card Number: ${decryptedGha}`, MARGIN, yPos);
  yPos += 12;

  // Account Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 166, 81);
  doc.text('Bank Account Information', MARGIN, yPos);
  yPos += 5;

  const tableSubHeaders = ['Account Type', 'Bank Name', 'Branch', 'Account Name', 'Account Number'];
  const data = mandate.accounts.map(acc => [
    acc.account_order,
    acc.bank_name,
    acc.branch,
    acc.account_name,
    decrypt(acc.account_number)
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [tableSubHeaders],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [0, 166, 81], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [240, 255, 245] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Mandate Agreement
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 166, 81);
  doc.text('Authorization', MARGIN, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(33, 33, 33);
  const agreementText = "I/We hereby authorize you (the Bank) to debit my/our account with the amounts specified above. This mandate is to remain in force until cancelled by me/us in writing.";
  doc.text(doc.splitTextToSize(agreementText, PAGE_WIDTH - 2 * MARGIN), MARGIN, yPos);
  
  yPos += 18;

  // Signature
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(33, 33, 33);
  doc.text('Digital Signature:', MARGIN, yPos);
  yPos += 4;

  if (mandate.digital_signature_path && mandate.digital_signature_path.startsWith('data:image')) {
    try {
        doc.addImage(mandate.digital_signature_path, 'PNG', MARGIN, yPos, 60, 25);
        yPos += 28;
    } catch (e) {
        doc.text("[Signature could not be rendered]", MARGIN, yPos + 5);
        yPos += 10;
    }
  } else if (mandate.digital_signature_path) {
      doc.text("[Digital Signature on file]", MARGIN, yPos + 5);
      yPos += 10;
  } else {
      doc.text("Signature: __________________________", MARGIN, yPos + 5);
      yPos += 10;
  }
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Signed Date: ${mandate.submitted_at ? new Date(mandate.submitted_at).toLocaleDateString() : 'N/A'}`, MARGIN, yPos);
  doc.text(`IP Address: ${mandate.ip_address || 'N/A'}`, PAGE_WIDTH - MARGIN, yPos, { align: 'right' });

  // Footer bar
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(0, 166, 81);
  doc.rect(0, pageHeight - 12, PAGE_WIDTH, 12, 'F');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('Letshego Ghana Savings and Loans PLC | Direct Debit Mandate System', PAGE_WIDTH / 2, pageHeight - 5, { align: 'center' });

  return doc;
}
