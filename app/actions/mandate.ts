'use server';

import { prisma } from '@/lib/db';

export async function getSubmittedMandates() {
  const mandates = await prisma.directDebitMandate.findMany({
    include: {
      customer: true,
      accounts: true,
      generatedPDFs: {
        orderBy: { generated_at: 'desc' },
        take: 1,
      },
    },
    orderBy: { submitted_at: 'desc' },
  });

  // Serialize dates for client components
  return mandates.map((m) => ({
    id: m.id,
    submittedAt: m.submitted_at.toISOString(),
    customerName: m.customer.full_name,
    customerPhone: m.customer.phone_number,
    customerId: m.customer.id,
    accountCount: m.accounts.length,
    hasPDF: m.generatedPDFs.length > 0,
    pdfPath: m.generatedPDFs[0]?.file_path ?? null,
    ipAddress: m.ip_address,
  }));
}
