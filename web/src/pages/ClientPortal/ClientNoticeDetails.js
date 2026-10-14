import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientPortalApi } from '../../api/endpoints';
import { 
    FileText, 
    Calendar, 
    AlertCircle, 
    Download, 
    Upload, 
    ChevronLeft,
    CheckCircle,
    Clock
} from 'lucide-react';
import { format } from 'date-fns';

const ClientNoticeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [notice, setNotice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNoticeDetail();
    }, [id]);

    const fetchNoticeDetail = async () => {
        try {
            const res = await clientPortalApi.getNoticeById(id);
            setNotice(res.data.data);
        } catch (err) {
            setError('Could not load notice details');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await clientPortalApi.uploadDocument(id, formData);
            fetchNoticeDetail(); // Refresh to show new doc
        } catch (err) {
            alert('Upload failed: ' + (err.response?.data?.message || 'Unknown error'));
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadPdf = async () => {
        try {
            const response = await clientPortalApi.downloadResponsePdf(id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Notice_Response_${notice.referenceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('PDF not yet available or download failed.');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (error) return <div className="p-8 text-red-600 font-medium">{error}</div>;
    if (!notice) return <div className="p-8 text-gray-500">Notice not found</div>;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <button 
                onClick={() => navigate('/portal/dashboard')}
                className="flex items-center text-sm text-gray-500 hover:text-blue-600 mb-6 transition-colors"
            >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                                {notice.department} • {notice.assessmentYear}
                            </span>
                            <h1 className="text-2xl font-bold text-gray-900 mt-1">
                                {notice.referenceNumber}
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">{notice.type}</p>
                        </div>
                        <div className="flex items-center">
                            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${
                                notice.status === 'Response Filed' 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                                {notice.status === 'Response Filed' ? 'Filed Successfully' : 'In Progress'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 rounded-lg p-6">
                        <div className="flex items-start">
                            <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-medium">Due Date</p>
                                <p className="text-sm font-semibold text-gray-900">
                                    {format(new Date(notice.dueDate), 'dd MMM yyyy')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <Clock className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-medium">Last Updated</p>
                                <p className="text-sm font-semibold text-gray-900">
                                    {format(new Date(notice.updatedAt), 'dd MMM yyyy')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 p-6 bg-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Your Action Required</h3>
                    </div>
                    
                    {notice.status !== 'Response Filed' ? (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start">
                            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-blue-800">Please upload supporting documents</p>
                                <p className="text-xs text-blue-600 mt-1">Our team is drafting your response. Providing digital copies of relevant bills/ledgers helps us file sooner.</p>
                                <label className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                                    <Upload className="h-4 w-4 mr-2" />
                                    {uploading ? 'Uploading...' : 'Upload Supporting Doc'}
                                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-green-800">Response Filed</p>
                                <p className="text-xs text-green-600 mt-1">No further action is needed at this time. You can download the filed copy below.</p>
                                <button 
                                    onClick={handleDownloadPdf}
                                    className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Filed PDF
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 px-1">Attached Documents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {notice.documents?.map((doc) => (
                        <div key={doc._id} className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between hover:border-blue-300 transition-colors shadow-sm">
                            <div className="flex items-center min-w-0">
                                <FileText className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                                <div className="truncate">
                                    <p className="text-sm font-medium text-gray-900 truncate">{doc.originalName}</p>
                                    <p className="text-xs text-gray-500 capitalize">{doc.category.replace(/([A-Z])/g, ' $1')}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ClientNoticeDetails;
