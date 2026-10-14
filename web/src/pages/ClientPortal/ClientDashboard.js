import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clientPortalApi } from '../../api/endpoints';
import { useClientAuth } from '../../auth/ClientAuthContext';
import { FileText, Clock, CheckCircle, ChevronRight, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const ClientDashboard = () => {
    const { clientUser } = useClientAuth();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotices = async () => {
            try {
                const res = await clientPortalApi.getNotices();
                setNotices(res.data.data);
            } catch (error) {
                console.error('Error fetching notices:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotices();
    }, []);

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Received':
            case 'In Progress':
                return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            case 'Draft Ready':
            case 'Under Review':
                return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Response Filed':
            case 'Closed':
                return 'bg-green-50 text-green-700 border-green-100';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-500 font-medium">Loading your dashboard...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome back, {clientUser?.firstName}</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {notices.length} active {notices.length === 1 ? 'notice' : 'notices'} requiring your attention.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg text-blue-700 text-sm font-medium border border-blue-100">
                    <AlertCircle className="h-4 w-4" />
                    Last login: {format(new Date(clientUser?.lastLoginAt || Date.now()), 'dd MMM, HH:mm')}
                </div>
            </div>

            {notices.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center shadow-sm">
                    <div className="mx-auto h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Compliance Clear</h3>
                    <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                        Excellent! You have no pending notices or actions required at this moment.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notices.map((notice) => (
                        <Link 
                            key={notice._id} 
                            to={`/portal/notices/${notice._id}`}
                            className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 group flex flex-col"
                        >
                            <div className="p-6 flex-1">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-600 transition-colors">
                                        <FileText className="h-6 w-6 text-blue-600 group-hover:text-white" />
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyles(notice.status)}`}>
                                        {notice.status}
                                    </span>
                                </div>
                                
                                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                    {notice.referenceNumber}
                                </h3>
                                <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed">
                                    {notice.type} • {notice.department}
                                </p>
                                
                                <div className="space-y-3 pt-5 border-t border-gray-50">
                                    <div className="flex items-center text-xs font-medium text-gray-500">
                                        <Calendar className="h-4 w-4 mr-2.5 text-gray-400" />
                                        Assessment: {notice.assessmentYear}
                                    </div>
                                    <div className="flex items-center text-xs font-medium text-red-500 bg-red-50 py-1.5 px-3 rounded-lg w-fit">
                                        <Clock className="h-4 w-4 mr-2.5" />
                                        Due: {format(new Date(notice.dueDate), 'dd MMM yyyy')}
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm font-bold text-blue-600 group-hover:bg-blue-50 transition-colors">
                                <span>Action Required</span>
                                <ChevronRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientDashboard;
