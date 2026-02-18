import { z } from 'zod';

export const mandateFormSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }),
  ghanaCardNumber: z.string().regex(/^GHA-[0-9]{9}-\d$/, { message: 'Invalid Ghana Card Number format (e.g., GHA-123456789-0).' }),
  
  accounts: z.array(z.object({
    bankName: z.string().min(2, { message: 'Bank name is required.' }),
    branch: z.string().min(2, { message: 'Branch name is required.' }),
    accountName: z.string().min(2, { message: 'Account name is required.' }),
    accountNumber: z.string().min(8, { message: 'Account number is required.' }),
    accountOrder: z.enum(['1ST', '2ND', '3RD']),
  })).min(1, { message: 'At least one account is required.' }),
  
  agreementAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions.',
  }),
  
  signature: z.string().min(1, { message: 'Signature is required.' }), // Base64 string from canvas
});
