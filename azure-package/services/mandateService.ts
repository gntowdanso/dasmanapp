import { prisma } from '../lib/db';
import { encrypt } from '../lib/encryption';
import { Customer, DirectDebitMandate } from '@prisma/client';

export type CreateMandateArgs = {
  customerId: string;
  ghanaCardNumber: string;
  agreementAccepted: boolean;
  digitalSignaturePath?: string;
  ipAddress?: string;
  accounts: {
    accountOrder: '1ST' | '2ND' | '3RD';
    bankName: string;
    branch: string;
    accountName: string;
    accountNumber: string;
  }[];
};

export async function createMandate(args: CreateMandateArgs) {
  // 1. Validate customer status
  const customer = await prisma.customer.findUnique({
    where: { id: args.customerId },
  });

  if (!customer || customer.status === 'SUBMITTED') {
    throw new Error('Customer not found or mandate already submitted.');
  }

  // 2. Encrypt sensitive data
  const encryptedGhanaCard = encrypt(args.ghanaCardNumber);

  // 3. Create Mandate and Accounts in a transaction
  const mandate = await prisma.directDebitMandate.create({
    data: {
      customer_id: args.customerId,
      ghana_card_number: encryptedGhanaCard,
      agreement_accepted: args.agreementAccepted,
      digital_signature_path: args.digitalSignaturePath,
      ip_address: args.ipAddress,
      accounts: {
        create: args.accounts.map((acc) => ({
          account_order: acc.accountOrder,
          bank_name: acc.bankName,
          branch: acc.branch,
          account_name: acc.accountName,
          account_number: encrypt(acc.accountNumber),
        })),
      },
    },
    include: {
      accounts: true,
    },
  });

  // 4. Update customer status
  await prisma.customer.update({
    where: { id: args.customerId },
    data: { status: 'SUBMITTED', session_token: null }, // Invalidate token immediately
  });

  return mandate;
}

export async function getMandate(id: string) {
  const mandate = await prisma.directDebitMandate.findUnique({
    where: { id },
    include: { accounts: true, customer: true },
  });
  
  if (!mandate) return null;
  
  // Decrypt sensitive fields for authorized view (Admin/PDF gen)
  // mandate.ghana_card_number = decrypt(mandate.ghana_card_number); // Implement decryption helper if needed here
  
  return mandate;
}
