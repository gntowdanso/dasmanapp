'use client';

import { useEffect, useState } from 'react';
import { FileDown, Download, RefreshCw, Search, AlertCircle } from 'lucide-react';
import { getSubmittedMandates } from '@/app/actions/mandate';

type MandateRow = {
  id: string;
  submittedAt: string;
  customerName: string;
  customerPhone: string;
  customerId: string;
  accountCount: number;
  hasPDF: boolean;
  pdfPath: string | null;
  ipAddress: string | null;
};

export default function DownloadMandatesPage() {
  const [mandates, setMandates] = useState<MandateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMandates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSubmittedMandates();
      setMandates(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load mandates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMandates();
  }, []);

  const handleDownloadPDF = async (mandateId: string, customerName: string) => {
    setDownloading(mandateId);
    try {
      const response = await fetch(`/api/mandates/${mandateId}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Mandate_${customerName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to download PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setDownloading(null);
    }
  };

  const handleBulkDownload = async () => {
    const filtered = filteredMandates;
    if (filtered.length === 0) return;

    setDownloading('bulk');
    for (const mandate of filtered) {
      try {
        await handleDownloadPDF(mandate.id, mandate.customerName);
        await new Promise((r) => setTimeout(r, 500));
      } catch {
        // continue with next
      }
    }
    setDownloading(null);
  };

  const handleExportCSV = () => {
    const filtered = filteredMandates;
    if (filtered.length === 0) return;

    const headers = ['Customer Name', 'Phone Number', 'Accounts', 'Submitted Date', 'IP Address', 'Mandate ID'];
    const rows = filtered.map((m) => [
      m.customerName,
      m.customerPhone,
      m.accountCount.toString(),
      new Date(m.submittedAt).toLocaleString(),
      m.ipAddress || 'N/A',
      m.id,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mandates_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredMandates = mandates.filter(
    (m) =>
      m.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.customerPhone.includes(searchTerm) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Download Mandates</h1>
          <p className="mt-1 text-sm text-gray-500">
            {mandates.length} submitted mandate{mandates.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMandates}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filteredMandates.length === 0}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={handleBulkDownload}
            disabled={filteredMandates.length === 0 || downloading === 'bulk'}
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {downloading === 'bulk' ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download All PDFs
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, phone, or mandate ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error loading mandates</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mr-3" />
            <span className="text-gray-500 text-sm">Loading mandates...</span>
          </div>
        ) : filteredMandates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <FileDown className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-sm font-medium">
              {searchTerm ? 'No mandates match your search' : 'No submitted mandates yet'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm
                ? 'Try adjusting your search term'
                : 'Mandates will appear here once customers submit them'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accounts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mandate ID
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMandates.map((mandate, index) => (
                  <tr key={mandate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {mandate.customerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mandate.customerPhone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {mandate.accountCount} account{mandate.accountCount !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(mandate.submittedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                      <span className="block text-xs text-gray-400">
                        {new Date(mandate.submittedAt).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">
                      {mandate.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDownloadPDF(mandate.id, mandate.customerName)}
                        disabled={downloading === mandate.id}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 transition-colors"
                      >
                        {downloading === mandate.id ? (
                          <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-1.5" />
                        )}
                        PDF
                      </button>
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
