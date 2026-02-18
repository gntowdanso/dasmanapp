'use client';

import { useState, useEffect } from 'react';
import { getCustomersForSMS, sendBulkSMS } from '@/app/actions/sms';
import { updateCustomerMobile, deleteCustomer } from '@/app/actions/customer';
import { Check, AlertCircle, RefreshCw, Send, Users, MessageSquare, Pencil, Trash2, X, Save } from 'lucide-react';

interface Customer {
    id: string;
    full_name: string;
    phone_number: string;
    status: string;
    external_id: string | null;
    account_number: string | null;
}

export default function TriggerSMSPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [message, setMessage] = useState('Dear {name}, please complete your direct debit mandate here: {link}');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
    
    // Editing state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editMobile, setEditMobile] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        setIsLoading(true);
        try {
            const data = await getCustomersForSMS();
            const formatted: Customer[] = data.map(c => ({
                id: c.id,
                full_name: c.full_name,
                phone_number: c.phone_number,
                status: c.status,
                external_id: c.external_id,
                account_number: c.account_number || 'N/A'
            }));
            setCustomers(formatted);
        } catch (error) {
            console.error('Failed to load customers', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === customers.length && customers.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(customers.map(c => c.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSend = async () => {
        if (selectedIds.size === 0) return;
        
        setIsSending(true);
        setResult(null);

        try {
            const response = await sendBulkSMS(Array.from(selectedIds), message);
            setResult({
                success: response.success,
                failed: response.failed,
                errors: response.errors
            });
            if (response.success > 0) {
                // optional: reload or clear selection
            }
        } catch (error) {
            console.error('Failed to send SMS', error);
            setResult({
                success: 0,
                failed: selectedIds.size,
                errors: ['Unexpected error occurred']
            });
        } finally {
            setIsSending(false);
        }
    };

    const startEditing = (customer: Customer, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(customer.id);
        setEditMobile(customer.phone_number);
    };

    const cancelEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
        setEditMobile('');
    };

    const saveMobile = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!editMobile.trim()) return;

        setIsSaving(true);
        try {
            const result = await updateCustomerMobile(id, editMobile);
            if (result.success) {
                setCustomers(customers.map(c => c.id === id ? { ...c, phone_number: editMobile } : c));
                setEditingId(null);
            } else {
                alert('Failed to update mobile: ' + result.error);
            }
        } catch (error: any) {
            alert('Error updating mobile: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            try {
                const result = await deleteCustomer(id);
                if (result.success) {
                    setCustomers(customers.filter(c => c.id !== id));
                    if (selectedIds.has(id)) {
                        const newSelected = new Set(selectedIds);
                        newSelected.delete(id);
                        setSelectedIds(newSelected);
                    }
                } else {
                    alert('Failed to delete customer: ' + result.error);
                }
            } catch (error: any) {
                alert('Error deleting customer: ' + error.message);
            }
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-6 h-6"/> Trigger SMS
            </h1>

            {/* Message Template Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Message Configuration</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            SMS Message Template
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
                            placeholder="Enter your message..."
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            Available variables: <span className="font-mono bg-gray-100 px-1 rounded">{'{name}'}</span>, <span className="font-mono bg-gray-100 px-1 rounded">{'{link}'}</span>, <span className="font-mono bg-gray-100 px-1 rounded">{'{account}'}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions & Feedback */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                 <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 font-medium">
                        {selectedIds.size} customer{selectedIds.size !== 1 ? 's' : ''} selected
                    </span>
                 </div>
                 <button
                    onClick={handleSend}
                    disabled={isSending || selectedIds.size === 0}
                    className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                 >
                    {isSending ? (
                        <>
                            <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send className="-ml-1 mr-2 h-4 w-4" />
                            Send SMS
                        </>
                    )}
                 </button>
            </div>

            {result && (
                 <div className={`p-4 rounded-md ${result.failed === 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                    <div className="flex">
                        <div className="flex-shrink-0">
                            {result.failed === 0 ? (
                                <Check className="h-5 w-5 text-green-400" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-yellow-400" />
                            )}
                        </div>
                        <div className="ml-3">
                            <h3 className={`text-sm font-medium ${result.failed === 0 ? 'text-green-800' : 'text-yellow-800'}`}>
                                Operation Completed
                            </h3>
                            <div className="mt-2 text-sm text-gray-700">
                                <p>Successfully sent: {result.success}</p>
                                <p>Failed: {result.failed}</p>
                                {result.errors.length > 0 && (
                                    <div className="mt-2">
                                        <p className="font-medium text-red-600">Errors:</p>
                                        <ul className="list-disc list-inside mt-1 text-red-700 pl-2 text-xs">
                                            {result.errors.slice(0, 5).map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                             {result.errors.length > 5 && (
                                                <li>...and {result.errors.length - 5} more</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                 </div>
            )}

            {/* Customers Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left w-10">
                                    <input
                                        type="checkbox"
                                        checked={customers.length > 0 && selectedIds.size === customers.length}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                    />
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Mobile
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer ID
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <RefreshCw className="animate-spin h-8 w-8 mb-2 text-blue-500" />
                                            <p>Loading customers...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Users className="h-12 w-12 text-gray-300 mb-2" />
                                            <p className="text-lg font-medium text-gray-900">No customers found</p>
                                            <p className="text-sm text-gray-500">Import customers to get started.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr 
                                        key={customer.id} 
                                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedIds.has(customer.id) ? 'bg-blue-50' : ''}`}
                                        onClick={() => toggleSelect(customer.id)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(customer.id)}
                                                onChange={() => toggleSelect(customer.id)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {customer.full_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
                                            {editingId === customer.id ? (
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="text"
                                                        value={editMobile}
                                                        onChange={(e) => setEditMobile(e.target.value)}
                                                        className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs py-1 px-2 border"
                                                        placeholder="Mobile"
                                                    />
                                                    <button onClick={(e) => saveMobile(customer.id, e)} disabled={isSaving} className="text-green-600 hover:text-green-800">
                                                        <Save className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={cancelEditing} className="text-gray-500 hover:text-gray-700">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-2 group">
                                                    <span>{customer.phone_number}</span>
                                                    <button 
                                                        onClick={(e) => startEditing(customer, e)}
                                                        className="text-gray-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Edit Mobile"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {customer.external_id || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${customer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                                                  customer.status === 'SUBMITTED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {customer.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={(e) => handleDelete(customer.id, customer.full_name, e)}
                                                className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors"
                                                title="Delete Customer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
