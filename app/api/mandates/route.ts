import { NextRequest, NextResponse } from 'next/server';
import { mandateFormSchema } from '@/lib/validators';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/encryption';
import { generateMandatePDF } from '@/lib/pdfGenerator';
import { writeFile, mkdir } from 'fs/promises';
import { headers } from 'next/headers'; // To check for Vercel env or just headers?
import { put } from '@vercel/blob';
import path from 'path';

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

    // Check customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Invalid Customer ID' }, { status: 400 });
    }

    if (customer.status === 'SUBMITTED') {
       // Allow resubmission? Probably not if token is invalidated.
    }

    // 2. Save Signature (Vercel Blob or Local Fallback)
    const signatureBuffer = Buffer.from(signature.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    let publicSignaturePath = '';

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { url } = await put(`signatures/sig_${customerId}_${Date.now()}.png`, signatureBuffer, {
        access: 'public',
      });
      publicSignaturePath = url;
    } else {
      // Local Fallback
      const signatureDir = path.join(process.cwd(), 'public', 'signatures');
      await mkdir(signatureDir, { recursive: true });
      const signatureFilename = `sig_${customerId}_${Date.now()}.png`;
      const signaturePath = path.join(signatureDir, signatureFilename);
      await writeFile(signaturePath, signatureBuffer);
      publicSignaturePath = `/signatures/${signatureFilename}`;
    }

    // 3. Create Mandate in Transaction
    const encryptedGha = encrypt(ghanaCardNumber);

    const mandate = await prisma.$transaction(async (tx) => {
        // Create Mandate
        const newMandate = await tx.directDebitMandate.create({
            data: {
                customer: { connect: { id: customerId } },
                ghana_card_number: encryptedGha,
                agreement_accepted: agreementAccepted,
                digital_signature_path: publicSignaturePath,
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

        // Update Customer
        await tx.customer.update({
            where: { id: customerId },
            data: { 
                status: 'SUBMITTED',
                session_token: null 
            }
        });

        return newMandate;
    });

    // 4. Generate PDF (Vercel Blob or Local Fallback)
    if (mandate) {
        const pdfDoc = generateMandatePDF(mandate as any); 
        const pdfArrayBuffer = pdfDoc.output('arraybuffer');
        const pdfBuffer = Buffer.from(pdfArrayBuffer);
        let pdfFilePath = '';

        if (process.env.BLOB_READ_WRITE_TOKEN) {
             const { url } = await put(`pdfs/Mandate_${mandate.id}.pdf`, pdfBuffer, {
                access: 'public',
             });
             pdfFilePath = url;
        } else {
            // Local Fallback
            const pdfDir = path.join(process.cwd(), 'public', 'pdfs');
            await mkdir(pdfDir, { recursive: true });
            const pdfFilename = `Mandate_${mandate.id}.pdf`;
            const pdfPath = path.join(pdfDir, pdfFilename);
            await writeFile(pdfPath, pdfBuffer);
            pdfFilePath = `/pdfs/${pdfFilename}`;
        }

        // Record PDF 
        await prisma.generatedPDF.create({
            data: {
                mandate_id: mandate.id,
                file_path: pdfFilePath,
            }
        });
    }

    return NextResponse.json({ success: true, mandateId: mandate.id }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating mandate:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
