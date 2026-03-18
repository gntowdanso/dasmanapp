import { prisma } from '@/lib/db';
import MandateForm from '@/components/MandateForm';

export const dynamic = 'force-dynamic';

export default async function MandatePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Link</h1>
        <p className="text-gray-600">
          No token was provided. Please use the link sent to you via SMS.
        </p>
      </div>
    );
  }

  // 1. Validate Token
  const customer = await prisma.customer.findUnique({
    where: { session_token: token },
  });

  if (!customer || customer.status !== 'PENDING') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid or Expired Link</h1>
        <p className="text-gray-600">
          This link is no longer valid. It may have already been used or has expired.
          Please contact support or request a new link.
        </p>
      </div>
    );
  }

  // 2. Check Expiry (30 minutes)
  if (customer.token_expiry && new Date() > customer.token_expiry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Link Expired</h1>
        <p className="text-gray-600">
          This link has expired. Please contact support to request a new one.
        </p>
      </div>
    );
  }

  // 3. Show mandate form — no login required
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow sm:p-8 p-4">
        <div className="flex justify-center mb-6">
          <img src="/letshego-logo.svg" alt="Letshego Ghana" className="h-14" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">Direct Debit Mandate</h1>
        <p className="text-gray-600 mb-8 text-center">
          Please complete the form below to authorize direct debit payments.
        </p>

        <MandateForm 
          customerId={customer.id} 
          customerName={customer.full_name}
          loanDetails={{
            balance: customer.loan_balance,
            monthlyRepayment: customer.monthly_repayment,
            startDate: customer.start_date,
            noOfMonths: customer.no_of_months
          }}
        />
      </div>
    </div>
  );
}
