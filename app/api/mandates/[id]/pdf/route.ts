import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateMandatePDF } from '@/lib/pdfGenerator';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const mandate = await prisma.directDebitMandate.findUnique({
      where: { id },
      include: {
        customer: true,
        accounts: true,
      },
    });

    if (!mandate) {
      return NextResponse.json({ error: 'Mandate not found' }, { status: 404 });
    }

    // Generate the PDF on-demand
    const pdfDoc = generateMandatePDF(mandate);
    const pdfArrayBuffer = pdfDoc.output('arraybuffer');

    const filename = `Mandate_${mandate.customer.full_name.replace(/\s+/g, '_')}_${mandate.id.substring(0, 8)}.pdf`;

    return new NextResponse(Buffer.from(pdfArrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
