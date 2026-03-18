'use client';

import React, { useState } from 'react';
import { Calculator, Download, Table, FileText } from 'lucide-react';

interface ScheduleRow {
    month: number;
    date: Date;
    beginningBalance: number;
    principal: number;
    interest: number;
    insurance: number;
    totalRepayment: number;
    endingBalance: number;
}

interface SummaryInfo {
    principal: number;
    adminFee: number;
    bpiFee: number;
    disbursementAmount: number;
    totalMonthlyRepayment: number;
    totalInterest: number;
    totalInsurance: number;
    totalRepayment: number;
}

export default function LoanSchedulePage() {
    const [principalStr, setPrincipalStr] = useState('');
    const [durationStr, setDurationStr] = useState('');
    const [startDateStr, setStartDateStr] = useState('');
    const [productType, setProductType] = useState<'CAGD' | 'OTHER'>('CAGD');
    
    const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
    const [summary, setSummary] = useState<SummaryInfo | null>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount);
    };

    const generateSchedule = (e: React.FormEvent) => {
        e.preventDefault();
        
        const P = parseFloat(principalStr);
        const n = parseInt(durationStr);
        const startDate = new Date(startDateStr);

        if (isNaN(P) || P <= 0 || isNaN(n) || n <= 0 || isNaN(startDate.getTime())) {
            alert('Please enter valid numeric values and a valid start date.');
            return;
        }

        // Configuration
        const annualInterestRate = 0.19; // 19% Amortized
        const monthlyInterestRate = annualInterestRate / 12;
        const adminFeeRate = 0.11; // 11%
        const bpiFeeRate = productType === 'CAGD' ? 0.01 : 0; // 1% for CAGD only
        const insuranceMonthlyRate = 0.005; // 0.5% Monthly

        // Recapitalise the Deductions
        const adminFee = P * adminFeeRate;
        const bpiFee = P * bpiFeeRate;
        
        // The new principal to be amortised includes the upfront fees
        const capitalisedPrincipal = P + adminFee + bpiFee;
        
        // The user receives the exact requested amount
        const disbursementAmount = P;
        
        // Insurance is calculated on the requested principal strictly per month
        const insurancePerMonth = P * insuranceMonthlyRate;

        // Base Amortized EMI Component on Capitalised Principal
        // Formula: A = P_cap * [ r(1 + r)^n ] / [ (1 + r)^n - 1]
        const baseEmi = capitalisedPrincipal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, n)) / (Math.pow(1 + monthlyInterestRate, n) - 1);
        const totalMonthlyRepayment = baseEmi + insurancePerMonth;

        let currentBalance = capitalisedPrincipal;
        const rows: ScheduleRow[] = [];
        let totalInterestPaid = 0;

        for (let i = 1; i <= n; i++) {
            const interestPayment = currentBalance * monthlyInterestRate;
            let principalPayment = baseEmi - interestPayment;
            
            // Adjust last payment to fix float rounding issues
            if (i === n) {
                principalPayment = currentBalance;
            }

            const rowDate = new Date(startDate);
            rowDate.setMonth(rowDate.getMonth() + i);

            const rowTotalRepayment = principalPayment + interestPayment + insurancePerMonth;
            totalInterestPaid += interestPayment;

            rows.push({
                month: i,
                date: rowDate,
                beginningBalance: currentBalance,
                principal: principalPayment,
                interest: interestPayment,
                insurance: insurancePerMonth,
                totalRepayment: rowTotalRepayment,
                endingBalance: Math.max(0, currentBalance - principalPayment)
            });

            currentBalance -= principalPayment;
        }

        setSchedule(rows);
        setSummary({
            principal: P,
            adminFee,
            bpiFee,
            disbursementAmount,
            totalMonthlyRepayment,
            totalInterest: totalInterestPaid,
            totalInsurance: insurancePerMonth * n,
            totalRepayment: totalMonthlyRepayment * n
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Calculator className="w-6 h-6 mr-2 text-blue-600" />
                    Loan Schedule Generator
                </h1>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <form onSubmit={generateSchedule} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                            <select 
                                value={productType}
                                onChange={(e) => setProductType(e.target.value as 'CAGD' | 'OTHER')}
                                className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                                <option value="CAGD">CAGD (Includes 1% BPI)</option>
                                <option value="OTHER">Other Products</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Principal Amount (GHS)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                placeholder="e.g. 5000"
                                value={principalStr}
                                onChange={(e) => setPrincipalStr(e.target.value)}
                                className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Months)</label>
                            <input 
                                type="number" 
                                placeholder="e.g. 12"
                                value={durationStr}
                                onChange={(e) => setDurationStr(e.target.value)}
                                className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Start Date</label>
                            <input 
                                type="date"
                                value={startDateStr}
                                onChange={(e) => setStartDateStr(e.target.value)}
                                className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                required
                            />
                        </div>

                        <div className="md:col-span-4 flex justify-end">
                            <button 
                                type="submit"
                                className="bg-blue-600 text-white px-6 py-2.5 rounded-md flex items-center font-medium hover:bg-blue-700 transition"
                            >
                                <Table className="w-4 h-4 mr-2" />
                                Generate Schedule
                            </button>
                        </div>
                    </form>
                </div>

                {summary && (
                    <div className="p-6 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-gray-500" />
                            Loan Summary
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded border border-gray-100 shadow-sm">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Principal</p>
                                <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.principal)}</p>
                            </div>
                            <div className="bg-white p-4 rounded border border-gray-100 shadow-sm">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Admin Fee (11%)</p>
                                <p className="text-lg font-semibold text-red-600">-{formatCurrency(summary.adminFee)}</p>
                            </div>
                            {summary.bpiFee > 0 && (
                                <div className="bg-white p-4 rounded border border-gray-100 shadow-sm">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">BPI Fee (1%)</p>
                                    <p className="text-lg font-semibold text-red-600">-{formatCurrency(summary.bpiFee)}</p>
                                </div>
                            )}
                            <div className="bg-blue-50 p-4 rounded border border-blue-100 shadow-sm">
                                <p className="text-xs text-blue-600 uppercase tracking-wide font-semibold">Net Disbursement</p>
                                <p className="text-xl font-bold text-blue-900">{formatCurrency(summary.disbursementAmount)}</p>
                            </div>
                            <div className="bg-white p-4 rounded border border-gray-100 shadow-sm">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Interest (19%)</p>
                                <p className="text-lg font-semibold text-gray-800">{formatCurrency(summary.totalInterest)}</p>
                            </div>
                            <div className="bg-white p-4 rounded border border-gray-100 shadow-sm">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Insurance (0.5%/m)</p>
                                <p className="text-lg font-semibold text-gray-800">{formatCurrency(summary.totalInsurance)}</p>
                            </div>
                            <div className="bg-white p-4 rounded border border-gray-100 shadow-sm">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Repayment Over Term</p>
                                <p className="text-lg font-semibold text-gray-800">{formatCurrency(summary.totalRepayment)}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded border border-green-100 shadow-sm">
                                <p className="text-xs text-green-700 uppercase tracking-wide font-semibold">Fixed Monthly Deductions</p>
                                <p className="text-xl font-bold text-green-900">{formatCurrency(summary.totalMonthlyRepayment)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {schedule.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Month</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Beg. Balance</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Principal</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Interest</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Insurance</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-blue-700 uppercase tracking-wider">Total Repayment</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">End Balance</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {schedule.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.month}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {row.date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                                            {formatCurrency(row.beginningBalance)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                                            {formatCurrency(row.principal)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                                            {formatCurrency(row.interest)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                                            {formatCurrency(row.insurance)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-700 text-right">
                                            {formatCurrency(row.totalRepayment)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                                            {formatCurrency(row.endingBalance)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}