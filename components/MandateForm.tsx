'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { mandateFormSchema } from '@/lib/validators';
import { z } from 'zod'; // Import z from Zod directly for type
import SignatureCanvas from 'react-signature-canvas';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type FormData = z.infer<typeof mandateFormSchema>;

export default function MandateForm({ 
  customerId, 
  customerName,
  loanDetails 
}: { 
  customerId: string; 
  customerName: string;
  loanDetails?: {
    balance?: string | null;
    monthlyRepayment?: string | null;
    startDate?: Date | null;
    noOfMonths?: number | null;
  }
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const sigPad = useRef<SignatureCanvas>(null);
  const sigContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(mandateFormSchema),
    defaultValues: {
      fullName: customerName,
      accounts: [{ accountOrder: '1ST', bankName: '', branch: '', accountName: '', accountNumber: '' }],
      agreementAccepted: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'accounts',
  });

  const resizeSignatureCanvas = useCallback(() => {
    const canvasInstance = sigPad.current;
    const container = sigContainerRef.current;

    if (!canvasInstance || !container) return;

    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;

    const dataUrl = !canvasInstance.isEmpty()
      ? canvasInstance.toDataURL()
      : signatureData;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const canvas = canvasInstance.getCanvas();
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const context = canvas.getContext('2d');
    if (context) {
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    canvasInstance.clear();
    if (dataUrl) {
      canvasInstance.fromDataURL(dataUrl);
    }
  }, [signatureData]);

  useEffect(() => {
    resizeSignatureCanvas();

    const container = sigContainerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => resizeSignatureCanvas());
    observer.observe(container);
    return () => observer.disconnect();
  }, [resizeSignatureCanvas]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Get signature data URL
      const signaturePayload = signatureData || sigPad.current?.toDataURL() || '';
      
      const response = await fetch('/api/mandates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, signature: signaturePayload, customerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      router.push('/success'); // Create success page
    } catch (error) {
      console.error(error);
      alert('Failed to submit mandate. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearSignature = () => {
    sigPad.current?.clear();
    setSignatureData('');
    setValue('signature', '');
  };

  const saveSignature = () => {
    if (sigPad.current && !sigPad.current.isEmpty()) {
      const dataUrl = sigPad.current.toDataURL();
      setSignatureData(dataUrl);
      setValue('signature', dataUrl);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      
      {/* Logo */}
      <div className="flex justify-center mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/logo_0.png" alt="Company Logo" className="h-16 object-contain" />
      </div>

      {/* Intro Text from Mandate Form */}
      <div className="bg-gray-50 p-6 rounded shadow border border-gray-200 text-sm text-gray-800 leading-relaxed">
        <p className="font-bold mb-2">Dear Sir/Madam,</p>
        <p>
            I/We hereby request, instruct and authorize you to debit my/our account with the amounts specified below 
            and transfer the same to the account of Letshego Ghana Savings and Loans PLC. 
            This mandate is to remain in force until cancelled by me/us in writing.
        </p>
      </div>

      {loanDetails && (
        <section className="bg-white p-6 rounded shadow border border-gray-100 pb-2">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Loan Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                {loanDetails.balance && (
                    <div>
                        <span className="font-semibold block">Loan Balance:</span>
                        <span>{loanDetails.balance}</span>
                    </div>
                )}
                {loanDetails.monthlyRepayment && (
                    <div>
                        <span className="font-semibold block">Monthly Repayment:</span>
                        <span>{loanDetails.monthlyRepayment}</span>
                    </div>
                )}
                {loanDetails.startDate && (
                    <div>
                        <span className="font-semibold block">Start Date:</span>
                        <span>{new Date(loanDetails.startDate).toLocaleDateString()}</span>
                    </div>
                )}
                {loanDetails.noOfMonths && (
                    <div>
                        <span className="font-semibold block">Duration (Months):</span>
                        <span>{loanDetails.noOfMonths}</span>
                    </div>
                )}
            </div>
        </section>
      )}

      {/* Customer Details Section */}
      <section className="bg-white p-6 rounded shadow border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">1. Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              {...register('fullName')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              readOnly // Often pre-filled and locked based on prompt "less data entry"
            />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Ghana Card Number</label>
            <input
              {...register('ghanaCardNumber')}
              placeholder="GHA-123456789-0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
            {errors.ghanaCardNumber && <p className="text-red-500 text-xs mt-1">{errors.ghanaCardNumber.message}</p>}
          </div>
        </div>
      </section>

      {/* Accounts Section */}
      <section className="bg-white p-6 rounded shadow border border-gray-100">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">2. Bank Accounts</h2>
            {fields.length < 3 && (
                <button
                type="button"
                onClick={() => append({ accountOrder: fields.length === 1 ? '2ND' : '3RD', bankName: '', branch: '', accountName: '', accountNumber: '' })}
                className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100"
                >
                + Add Account
                </button>
            )}
        </div>
        
        <div className="space-y-6">
            {fields.map((field, index) => (
            <div key={field.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
                <div className="absolute top-2 right-2 text-xs font-bold text-gray-400">
                    {index === 0 ? "Primary Account (1st)" : index === 1 ? "Secondary (2nd)" : "Tertiary (3rd)"}
                </div>
                {index > 0 && (
                    <button type="button" onClick={() => remove(index)} className="absolute top-2 right-24 text-red-500 text-xs hover:underline">Remove</button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                        <select {...register(`accounts.${index}.bankName`)} className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border">
                            <option value="">Select Bank</option>
                            {['GCB Bank', 'Ecobank Ghana', 'Absa Bank Ghana', 'Stanbic Bank', 'Fidelity Bank', 'Standard Chartered Bank', 'Zenith Bank', 'CalBank', 'Consolidated Bank Ghana (CBG)', 'United Bank for Africa (UBA)', 'Société Générale Ghana', 'Access Bank', 'Guaranty Trust Bank (GTBank)', 'First Atlantic Bank', 'FBNBank', 'Prudential Bank', 'OmniBSIC Bank', 'Republic Bank', 'Agricultural Development Bank (ADB)'].map(bank => (
                                <option key={bank} value={bank}>{bank}</option>
                            ))}
                        </select>
                        {errors.accounts?.[index]?.bankName && <p className="text-red-500 text-xs">{errors.accounts[index]?.bankName?.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Branch</label>
                        <input {...register(`accounts.${index}.branch`)} className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border" />
                        {errors.accounts?.[index]?.branch && <p className="text-red-500 text-xs">{errors.accounts[index]?.branch?.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Account Name</label>
                        <input {...register(`accounts.${index}.accountName`)} className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border" />
                        {errors.accounts?.[index]?.accountName && <p className="text-red-500 text-xs">{errors.accounts[index]?.accountName?.message}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Account Number</label>
                        <input {...register(`accounts.${index}.accountNumber`)} className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border" />
                        {errors.accounts?.[index]?.accountNumber && <p className="text-red-500 text-xs">{errors.accounts[index]?.accountNumber?.message}</p>}
                    </div>
                </div>
            </div>
            ))}
        </div>
      </section>

      {/* Agreement Section */}
      <section className="bg-white p-6 rounded shadow border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">3. Authorization & Signature</h2>
        
        <div className="mb-4">
            <label className="flex items-start space-x-3">
                <input
                    type="checkbox"
                    {...register('agreementAccepted')}
                    className="h-5 w-6 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5"
                />
                <span className="text-sm text-gray-600">
                    I/We hereby authorize you (the Bank) to create a Direct Debit Mandate on my account. I understand that I can cancel this mandate at any time by writing to my Bank.
                </span>
            </label>
            {errors.agreementAccepted && <p className="text-red-500 text-xs mt-1">{errors.agreementAccepted.message}</p>}
        </div>

        <div className="border rounded-md p-4 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">Digital Signature</label>
          <div ref={sigContainerRef} className="border border-gray-300 bg-white rounded cursor-crosshair" style={{ height: 200 }}>
                <SignatureCanvas 
                    ref={sigPad}
                    penColor="black"
                    canvasProps={{ className: 'w-full h-full' }}
                    onEnd={saveSignature}
                />
            </div>
            <div className="mt-2 flex justify-end space-x-2">
                <button type="button" onClick={clearSignature} className="text-sm text-gray-500 hover:text-gray-700 underline">Clear Signature</button>
            </div>
            <input type="hidden" {...register('signature')} />
            {errors.signature && <p className="text-red-500 text-xs mt-1">{errors.signature.message}</p>}
        </div>
      </section>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
          {isSubmitting ? (
             <>
               <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
               Processing...
             </>
          ) : (
            'Submit Mandate'
          )}
        </button>
      </div>
    </form>
  );
}
