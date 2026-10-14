import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '../../auth/ClientAuthContext';
import { Shield, Mail, Lock } from 'lucide-react';

const ClientLogin = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState('email'); // 'email', 'otp', 'password'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { login, requestOtp, verifyOtp } = useClientAuth();
    const navigate = useNavigate();

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await requestOtp(email);
            setStep('otp');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await verifyOtp(email, otp);
            navigate('/portal/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired OTP');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await login(email, password);
            navigate('/portal/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center flex-col items-center">
                    <Shield className="h-12 w-12 text-blue-600 mb-2" />
                    <h2 className="text-center text-3xl font-extrabold text-gray-900">
                        Client Portal Login
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Secure access to your tax records and notices
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
                    {error && (
                        <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                            <div className="text-sm text-red-700">{error}</div>
                        </div>
                    )}

                    {step === 'email' && (
                        <form className="space-y-6" onSubmit={handleRequestOtp}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email address</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2.5 px-3 border"
                                        placeholder="client@company.com"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Sending OTP...' : 'Login with OTP'}
                            </button>
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setStep('password')}
                                    className="text-sm text-blue-600 hover:text-blue-500"
                                >
                                    Login with password instead
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'otp' && (
                        <form className="space-y-6" onSubmit={handleVerifyOtp}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Verify OTP</label>
                                <p className="text-xs text-gray-500 mb-2">Code sent to {email}</p>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        maxLength="6"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 text-lg tracking-widest sm:text-sm border-gray-300 rounded-md py-2.5 px-3 border"
                                        placeholder="123456"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || otp.length < 6}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Verifying...' : 'Verify & Sign In'}
                            </button>
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setStep('email')}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Change email address
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'password' && (
                        <form className="space-y-6" onSubmit={handlePasswordLogin}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2.5 px-3 border bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2.5 px-3 border"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Signing in...' : 'Sign in securely'}
                            </button>
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setStep('email')}
                                    className="text-sm text-blue-600 hover:text-blue-500"
                                >
                                    Login with OTP instead
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientLogin;
