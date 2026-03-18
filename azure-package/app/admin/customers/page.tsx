'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getCustomers, updateCustomerDetails, deleteCustomer } from '@/app/actions/customer';
import { Search, Edit2, Trash2, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Customer } from '@prisma/client';

function EditModal({ 
    customer, 
    onClose, 
    onSave 
}: { 
    customer: Partial<Customer>; 
    onClose: () => void; 
    onSave: (id: string, data: Partial<Customer>) => void 
}) {
    const [editForm, setEditForm] = useState<Partial<Customer>>(customer);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-800">Edit Customer</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-900 border-b pb-2">Personal Information</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input 
                                    className="w-full border border-gray-300 p-2 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500" 
                                    value={editForm.full_name || ''} 
                                    onChange={e => setEditForm({...editForm, full_name: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Number</label>
                                <input 
                                    className="w-full border border-gray-300 p-2 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-600" 
                                    value={editForm.external_id || ''} 
                                    onChange={e => setEditForm({...editForm, external_id: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input 
                                    className="w-full border border-gray-300 p-2 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500" 
                                    value={editForm.phone_number || ''} 
                                    onChange={e => setEditForm({...editForm, phone_number: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                                <input 
                                    className="w-full border border-gray-300 p-2 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-600" 
                                    value={editForm.account_number || ''} 
                                    onChange={e => setEditForm({...editForm, account_number: e.target.value})} 
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-medium text-gray-900 border-b pb-2">Loan Details</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Balance</label>
                                <input 
                                    className="w-full border border-gray-300 p-2 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500" 
                                    value={editForm.loan_balance || ''} 
                                    onChange={e => setEditForm({...editForm, loan_balance: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Repayment</label>
                                <input 
                                    className="w-full border border-gray-300 p-2 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500" 
                                    value={editForm.monthly_repayment || ''} 
                                    onChange={e => setEditForm({...editForm, monthly_repayment: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Months)</label>
                                <input 
                                    type="number"
                                    className="w-full border border-gray-300 p-2 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500" 
                                    value={editForm.no_of_months || ''} 
                                    onChange={e => setEditForm({...editForm, no_of_months: Number(e.target.value)})} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input 
                                    type="date"
                                    className="w-full border border-gray-300 p-2 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-600" 
                                    value={editForm.start_date as unknown as string || ''} 
                                    onChange={e => setEditForm({...editForm, start_date: e.target.value as any})} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50 mt-auto rounded-b-lg">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onSave(customer.id as string, editForm)} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Customer>>({});

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        const res = await getCustomers(page, 10, search);
        if (res.success && res.data) {
            setCustomers(res.data as any);
            setTotalPages(res.pagination?.totalPages || 1);
        }
        setLoading(false);
    }, [page, search]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchCustomers();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [fetchCustomers]);

    const handleEdit = (customer: Customer) => {
        setEditingId(customer.id);
        const isoDate = customer.start_date ? new Date(customer.start_date).toISOString().split('T')[0] : '';
        setEditForm({ ...customer, start_date: isoDate as any });
    };

    const handleSaveEdit = async (id: string, formData: Partial<Customer>) => {
        const res = await updateCustomerDetails(id, formData);
        if (res.success) {
            setEditingId(null);
            fetchCustomers();
        } else {
            alert('Failed to update customer: ' + res.error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this customer?')) {
            const res = await deleteCustomer(id);
            if (res.success) {
                fetchCustomers();
            } else {
                alert('Failed to delete customer: ' + res.error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Customers List</h1>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div className="relative w-64">
                        <input
                            type="text"
                            placeholder="Search name, phone, etc..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name & Ext ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone / Account</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No customers found.</td>
                                </tr>
                            ) : (
                                customers.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        {/* Name & Ext ID */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{c.full_name}</div>
                                                <div className="text-sm text-gray-500">{c.external_id || 'N/A'}</div>
                                            </div>
                                        </td>
                                        
                                        {/* Phone / Account */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm text-gray-900">{c.phone_number}</div>
                                                <div className="text-sm text-gray-500">{c.account_number || 'N/A'}</div>
                                            </div>
                                        </td>

                                        {/* Loan Details */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm text-gray-900">Bal: {c.loan_balance || 'N/A'}</div>
                                                <div className="text-sm text-gray-500">Repay: {c.monthly_repayment || 'N/A'}</div>
                                            </div>
                                        </td>

                                        {/* Duration / Start */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm text-gray-900">{c.no_of_months || 'N/A'} months</div>
                                                <div className="text-sm text-gray-500">{c.start_date ? new Date(c.start_date).toLocaleDateString() : 'N/A'}</div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-3">
                                                <button onClick={() => handleEdit(c)} className="text-blue-600 hover:text-blue-900">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-900">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Showing page {page} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1 rounded border border-gray-300 disabled:opacity-50"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || totalPages === 0}
                            className="p-1 rounded border border-gray-300 disabled:opacity-50"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {editingId && editForm && (
                <EditModal 
                    customer={editForm} 
                    onClose={() => setEditingId(null)} 
                    onSave={handleSaveEdit} 
                />
            )}
        </div>
    );
}
