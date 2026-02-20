'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error
    console.error('Admin Dashboard Error:', error);
  }, [error]);

  return (
    <div className='flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50'>
      <div className='bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center'>
        <h2 className='text-xl font-bold text-red-600 mb-4'>Something went wrong!</h2>
        <p className='text-gray-600 mb-6 text-sm'>{error.message || "An unexpected error occurred."}</p>
        {error.digest && (
           <p className='text-xs text-gray-400 mb-4'>Error Ref: {error.digest}</p>
        )}
        <button
          onClick={() => reset()}
          className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors'
        >
          Try again
        </button>
      </div>
    </div>
  );
}
