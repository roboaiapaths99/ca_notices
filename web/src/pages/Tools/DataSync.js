import React, { useState } from 'react';
import { 
    CloudArrowUpIcon, 
    CheckCircleIcon, 
    ExclamationTriangleIcon,
    ArrowPathIcon,
    DocumentChartBarIcon
} from '@heroicons/react/24/outline';
import { importApi } from '../../api/endpoints';
import { toast } from 'react-hot-toast';

const DataSync = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setResults(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('ledgerFile', file);

        try {
            const response = await importApi.importLedger(formData);
            if (response.data.success) {
                setResults(response.data.data);
                toast.success('Ledger reconciled successfully!');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.message || 'Failed to process ledger');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ArrowPathIcon className="w-8 h-8 text-indigo-600" />
                    Tally / ERP Data Sync
                </h1>
                <p className="text-gray-600 mt-2">
                    Upload your client's ledger export (Excel/CSV) to automatically reconcile notice demands with book entries.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Upload Section */}
                <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4">Upload Ledger</h2>
                    <div 
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                            file ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                        }`}
                    >
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <span className="block text-sm font-medium text-gray-700">
                                {file ? file.name : 'Click to select Excel/CSV'}
                            </span>
                        </label>
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className={`w-full mt-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                            !file || uploading 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md active:scale-95'
                        }`}
                    >
                        {uploading ? (
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        ) : (
                            <CheckCircleIcon className="w-5 h-5" />
                        )}
                        {uploading ? 'Processing...' : 'Run Reconciliation'}
                    </button>

                    <div className="mt-6 text-xs text-gray-500">
                        <p className="font-medium mb-1 uppercase tracking-wider">Required Columns:</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Date</li>
                            <li>Particulars / Description</li>
                            <li>Vch No (Optional)</li>
                            <li>Debit / Credit / Amount</li>
                        </ul>
                    </div>
                </div>

                {/* Results Section */}
                <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4">Reconciliation Results</h2>
                    
                    {!results ? (
                        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                            <DocumentChartBarIcon className="w-16 h-16 mb-2 opacity-20" />
                            <p>Upload a file to see reconciliation stats</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-center">
                                    <span className="block text-2xl font-bold text-indigo-700">{results.totalProcessed}</span>
                                    <span className="text-xs text-indigo-600 uppercase font-medium">Rows Scanned</span>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
                                    <span className="block text-2xl font-bold text-green-700">{results.matched}</span>
                                    <span className="text-xs text-green-600 uppercase font-medium">Auto-Matched</span>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 text-center">
                                    <span className="block text-2xl font-bold text-amber-700">{results.discrepancies}</span>
                                    <span className="text-xs text-amber-600 uppercase font-medium">Flagged Mismatch</span>
                                </div>
                            </div>

                            {results.updates.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Newly Matched Notices</h3>
                                    <div className="overflow-hidden rounded-lg border border-gray-100">
                                        <table className="min-w-full divide-y divide-gray-100">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Client</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Amount</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                {results.updates.map((update, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2 text-sm text-gray-700">{update.clientName}</td>
                                                        <td className="px-4 py-2 text-sm font-medium italic">₹ {update.amount.toLocaleString('en-IN')}</td>
                                                        <td className="px-4 py-2 text-sm text-green-600 font-medium">RECONCILED</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {results.matched === 0 && results.discrepancies === 0 && (
                                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-200">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                                    No matches found. Ensure the ledger contains matching PANs in the particulars and exact demand amounts.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DataSync;
