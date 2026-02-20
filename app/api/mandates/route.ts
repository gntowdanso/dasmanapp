import { NextRequest, NextResponse } from 'next/server';
import { mandateFormSchema } from '@/lib/validators';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/encryption';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Zod Validation
    const validationResult = mandateFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { fullName, ghanaCardNumber, agreementAccepted, signature, accounts, customerId } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    // Check customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Invalid Customer ID' }, { status: 400 });
    }

    if (customer.status === 'SUBMITTED') {
      return NextResponse.json({ error: 'Mandate already submitted' }, { status: 400 });
    }

    // 2. Store signature as base64 data URL directly (no filesystem writes needed)
    const signaturePath = signature || '';

    // 3. Create Mandate in Transaction
    const encryptedGha = encrypt(ghanaCardNumber);

    const mandate = await prisma.$transaction(async (tx) => {
        const newMandate = await tx.directDebitMandate.create({
            data: {
                customer: { connect: { id: customerId } },
                ghana_card_number: encryptedGha,
                agreement_accepted: agreementAccepted,
                digital_signature_path: signaturePath,
                submitted_at: new Date(),
                ip_address: req.headers.get('x-forwarded-for') || '127.0.0.1',
                accounts: {
                    create: accounts.map((acc: any) => ({
                        account_order: acc.accountOrder,
                        bank_name: acc.bankName,
                        branch: acc.branch,
                        account_name: acc.accountName,
                        account_number: encrypt(acc.accountNumber),
                    }))
                }
            },
            include: { accounts: true, customer: true }
        });

        // Update Customer status
        await tx.customer.update({
            where: { id: customerId },
            data: { 
                status: 'SUBMITTED',
                session_token: null 
            }
        });

        return newMandate;
    });

    return NextResponse.json({ success: true, mandateId: mandate.id }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating mandate:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
