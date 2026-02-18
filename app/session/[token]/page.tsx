import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import MandateForm from '@/components/MandateForm'; // Client Component

export default async function SessionPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
  // 1. Validate Token
  const customer = await prisma.customer.findUnique({
    where: { session_token: token },
  });

  if (!customer || customer.status !== 'PENDING') {
    // If token invalid or used
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid or Expired Link</h1>
        <p className="text-gray-600">
          This session is no longer valid. Please contact support or request a new link.
        </p>
      </div>
    );
  }

  // 2. Check Expiry
  if (customer.token_expiry && new Date() > customer.token_expiry) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Link Expired</h1>
        <p className="text-gray-600">
          This link has expired. Please request a new one.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow sm:p-8 p-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Direct Debit Mandate</h1>
        <p className="text-gray-600 mb-8 text-center">
          Please complete the form below to authorize direct debit payments.
        </p>
        
        <MandateForm customerId={customer.id} customerName={customer.full_name} />
      </div>
    </div>
  );
}
