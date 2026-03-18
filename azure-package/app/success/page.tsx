export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 text-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-center mb-6">
          <img src="/letshego-logo.svg" alt="Letshego Ghana" className="h-12" />
        </div>
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Submission Successful!</h2>
        <p className="text-gray-600 mb-6">
          Your Direct Debit Mandate has been securely submitted and is being processed.
        </p>
        <p className="text-sm text-gray-500">
          You can close this window now.
        </p>
      </div>
    </div>
  );
}
