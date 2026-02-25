'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { importCustomersAction } from '@/app/actions/import';

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setImportResult(null);
            
            Papa.parse(selectedFile, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setPreview(results.data.slice(0, 5)); // Preview first 5 rows
                },
                error: (error) => {
                    console.error('Error parsing CSV:', error);
                }
            });
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const response = await importCustomersAction(results.data);
                    setImportResult({
                        success: response.successCount,
                        errors: response.errors
                    });
                } catch (error) {
                    console.error('Import failed', error);
                    setImportResult({
                        success: 0,
                        errors: ['An unexpected error occurred during import.']
                    });
                } finally {
                    setIsUploading(false);
                }
            }
        });
    };

    const downloadTemplate = () => {
        const csvContent = 'Name,Account no,Customer No,Status,Mobile,Loan Balance,Monthly Repayment,Start Date,No of Months\nEDNA MARBELL,2050627283,1200153755,Write Off,233249000000,5000.00,450.00,2025-01-01,12\nADAMS KYEI,1200509266,2050062847,Write Off,233245000000,10000.00,900.00,2025-02-15,24';
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'customer_import_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className='space-y-6'>
            <div className='flex justify-between items-center'>
                <h1 className='text-2xl font-bold text-gray-900'>Import Customers</h1>
                <button 
                    onClick={downloadTemplate}
                    className='flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 font-medium'
                >
                    <FileText className='w-4 h-4' />
                    <span>Download Template</span>
                </button>
            </div>

            <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-200'>
                <div className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors'>
                    <input
                        type='file'
                        accept='.csv'
                        onChange={handleFileChange}
                        className='hidden'
                        id='file-upload'
                        disabled={isUploading}
                    />
                    <label 
                        htmlFor='file-upload' 
                        className='cursor-pointer flex flex-col items-center justify-center space-y-4'
                    >
                        <div className='p-4 bg-blue-50 rounded-full'>
                            <Upload className='w-8 h-8 text-blue-600' />
                        </div>
                        <div className='space-y-1'>
                            <p className='text-sm font-medium text-gray-900'>
                                {file ? file.name : 'Click to upload a file'}
                            </p>
                            <p className='text-xs text-gray-500'>CSV files only</p>
                        </div>
                    </label>
                </div>

                {preview.length > 0 && !importResult && (
                    <div className='mt-8'>
                        <h3 className='text-sm font-medium text-gray-700 mb-4'>Preview (First 5 rows)</h3>
                        <div className='overflow-x-auto border rounded-lg'>
                            <table className='min-w-full divide-y divide-gray-200'>
                                <thead className='bg-gray-50'>
                                    <tr>
                                        {Object.keys(preview[0]).map((header) => (
                                            <th key={header} className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className='bg-white divide-y divide-gray-200'>
                                    {preview.map((row, idx) => (
                                        <tr key={idx}>
                                            {Object.values(row).map((val: any, i) => (
                                                <td key={i} className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                                    {val}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className='mt-6 flex justify-end'>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className='flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
                            >
                                {isUploading ? (
                                    <>
                                        <RefreshCw className='animate-spin -ml-1 mr-2 h-4 w-4' />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Check className='-ml-1 mr-2 h-4 w-4' />
                                        Import Customers
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {importResult && (
                    <div className={`mt-6 p-4 rounded-md ${importResult.errors.length > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                        <div className='flex'>
                            <div className='flex-shrink-0'>
                                {importResult.errors.length === 0 ? (
                                    <Check className='h-5 w-5 text-green-400' />
                                ) : (
                                    <AlertCircle className='h-5 w-5 text-red-400' />
                                )}
                            </div>
                            <div className='ml-3'>
                                <h3 className={`text-sm font-medium ${importResult.errors.length > 0 ? 'text-red-800' : 'text-green-800'}`}>
                                    Import Completed
                                </h3>
                                <div className='mt-2 text-sm text-gray-700'>
                                    <p>Successfully imported {importResult.success} customers.</p>
                                    {importResult.errors.length > 0 && (
                                        <div className='mt-2'>
                                            <p className='font-medium text-red-800'>Errors:</p>
                                            <ul className='list-disc list-inside mt-1 text-red-700'>
                                                {importResult.errors.slice(0, 5).map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                                {importResult.errors.length > 5 && (
                                                    <li>...and {importResult.errors.length - 5} more errors</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                <div className='mt-4'>
                                    <button
                                        onClick={() => {
                                            setFile(null);
                                            setPreview([]);
                                            setImportResult(null);
                                        }}
                                        className='text-sm font-medium text-blue-600 hover:text-blue-500'
                                    >
                                        Import another file
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
