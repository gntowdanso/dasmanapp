'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { login } from '@/app/actions/auth';
import { Loader2, Mail, Lock, ShieldCheck, ArrowRight } from 'lucide-react';

const initialState = {
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type='submit'
      disabled={pending}
      className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl'
    >
      {pending ? (
        <>
          <Loader2 className='animate-spin -ml-1 mr-2 h-5 w-5' />
          Signing in...
        </>
      ) : (
        <>
          Sign in
          <ArrowRight className='ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform' />
        </>
      )}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(login, initialState);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-yellow-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden'>
      {/* Background decoration */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden z-0'>
        <div className='absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-400 mix-blend-multiply filter blur-3xl opacity-20 animate-blob'></div>
        <div className='absolute top-40 -left-20 w-96 h-96 rounded-full bg-yellow-300 mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000'></div>
        <div className='absolute -bottom-40 left-20 w-96 h-96 rounded-full bg-blue-300 mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000'></div>
      </div>


      <div className='max-w-md w-full space-y-8 relative z-10'>
        <div className='bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-10 border border-white/20'>
            <div className='flex flex-col items-center'>
              <div className='h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300'>
                <ShieldCheck className='h-10 w-10 text-yellow-400' />
              </div>
              <h2 className='mt-6 text-center text-3xl font-extrabold text-blue-900 tracking-tight'>
                Letshego Ghana
              </h2>
              <p className='mt-2 text-center text-sm text-blue-700 bg-yellow-400/20 px-4 py-1 rounded-full border border-yellow-200 font-semibold'>
                Mandate Management System
              </p>
            </div>

            <form className='mt-8 space-y-6' action={formAction}>
              <div className='bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 mb-4'>
                <p className='font-bold mb-1'>Demo Credentials:</p>
                <p>Email: <code>admin@dasman.com</code></p>
                <p>Password: <code>Password123!</code></p>
              </div>
              <div className='space-y-4'>
                <div className='group'>
                  <label htmlFor='email' className='block text-sm font-medium text-blue-900 mb-1 ml-1'>Email Address</label>
                  <div className='relative rounded-md shadow-sm transition-all duration-300 group-focus-within:ring-2 group-focus-within:ring-blue-500 rounded-lg'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <Mail className='h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors' />
                    </div>
                    <input
                      id='email'
                      name='email'
                      type='email'
                      autoComplete='email'
                      required
                      defaultValue='admin@dasman.com'
                      className='block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-0 sm:text-sm bg-gray-50/50 focus:bg-white transition-all'
                      placeholder='admin@dasman.com'
                    />
                  </div>
                </div>

                <div className='group'>
                  <label htmlFor='password' className='block text-sm font-medium text-blue-900 mb-1 ml-1'>Password</label>
                  <div className='relative rounded-md shadow-sm transition-all duration-300 group-focus-within:ring-2 group-focus-within:ring-blue-500 rounded-lg'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <Lock className='h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors' />
                    </div>
                    <input
                      id='password'
                      name='password'
                      type='password'
                      autoComplete='current-password'
                      required
                      defaultValue='Password123!'
                      className='block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-0 sm:text-sm bg-gray-50/50 focus:bg-white transition-all'
                      placeholder='••••••••'
                    />
                  </div>
                </div>
              </div>

              {state?.message && (
                  <div className='flex items-center p-3 rounded-lg bg-red-50 border border-red-100 animate-pulse'>
                    <div className='flex-shrink-0'>
                        <svg className='h-5 w-5 text-red-500' viewBox='0 0 20 20' fill='currentColor'>
                            <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
                        </svg>
                    </div>
                    <p className='ml-3 text-sm text-red-700 font-medium'>{state.message}</p>
                  </div>
              )}

              <div>
                <SubmitButton />
              </div>
            </form>
            
            <div className='mt-6 text-center text-xs text-blue-400'>
                &copy; {new Date().getFullYear()} Letshego Ghana. All rights reserved.
            </div>
        </div>
      </div>
    </div>
  );
}
