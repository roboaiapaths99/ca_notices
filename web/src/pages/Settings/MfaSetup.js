import React, { useState, useEffect } from 'react';
import { mfaApi } from '../../api/endpoints';
import { toast } from 'react-hot-toast';
import { Shield, Smartphone, CheckCircle, RefreshCcw, XCircle } from 'lucide-react';

const MfaSetup = () => {
    const [step, setStep] = useState('intro'); // intro, qr, verify, active
    const [mfaData, setMfaData] = useState(null);
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);

    const startSetup = async () => {
        setLoading(true);
        try {
            const res = await mfaApi.setup();
            setMfaData(res.data.data);
            setStep('qr');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to start MFA setup');
        } finally {
            setLoading(false);
        }
    };

    const verifyAndEnable = async (e) => {
        e.preventDefault();
        if (token.length !== 6) {
            toast.error('Code must be 6 digits');
            return;
        }

        setLoading(true);
        try {
            await mfaApi.verifyAndEnable(token);
            toast.success('MFA enabled successfully');
            setStep('active');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const disableMfa = async () => {
        const pin = prompt('Enter your 6-digit MFA code to disable:');
        if (!pin) return;

        setLoading(true);
        try {
            await mfaApi.disable(pin);
            toast.success('MFA disabled');
            setStep('intro');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to disable MFA');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card max-w-2xl mx-auto mt-8">
            <div className="card-header flex items-center gap-3">
                <Shield className="text-primary-600" />
                <h3 className="card-title">Multi-Factor Authentication (MFA)</h3>
            </div>
            
            <div className="card-body">
                {step === 'intro' && (
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            Add an extra layer of security to your account. 
                            When enabled, you'll be required to provide a 6-digit code after logging in.
                        </p>
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <Smartphone size={32} className="text-gray-400" />
                            <div>
                                <h4 className="font-medium text-gray-900">How it works</h4>
                                <p className="text-sm text-gray-500">
                                    Use apps like Google Authenticator or Microsoft Authenticator to scan your unique QR code.
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={startSetup}
                            className="btn btn-primary w-full py-3"
                            disabled={loading}
                        >
                            Get Started
                        </button>
                    </div>
                )}

                {step === 'qr' && (
                    <div className="space-y-6 text-center">
                        <div>
                            <h4 className="font-semibold text-lg">Scan this QR Code</h4>
                            <p className="text-sm text-gray-500">
                                Open your authenticator app and scan the code below.
                            </p>
                        </div>
                        
                        <div className="inline-block p-4 bg-white border-2 border-primary-100 rounded-xl shadow-sm">
                            <img src={mfaData.qrCode} alt="MFA QR Code" className="w-48 h-48" />
                        </div>

                        <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-100">
                            <strong>Problem scanning?</strong> Enter code manually: <br/>
                            <code className="text-lg font-mono tracking-wider">{mfaData.secret}</code>
                        </div>

                        <button 
                            onClick={() => setStep('verify')}
                            className="btn btn-primary w-full py-3"
                        >
                            Next: Verify Code
                        </button>
                    </div>
                )}

                {step === 'verify' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h4 className="font-semibold text-lg">Verify Authenticator</h4>
                            <p className="text-sm text-gray-500">
                                Enter the 6-digit code displayed in your authenticator app.
                            </p>
                        </div>

                        <form onSubmit={verifyAndEnable} className="space-y-4">
                            <input
                                type="text"
                                maxLength={6}
                                value={token}
                                onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                className="input text-center text-2xl tracking-[1rem] font-bold h-16"
                                required
                            />
                            
                            <div className="flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setStep('qr')}
                                    className="btn btn-secondary flex-1"
                                >
                                    Back
                                </button>
                                <button 
                                    type="submit"
                                    className="btn btn-primary flex-1 py-3"
                                    disabled={loading || token.length !== 6}
                                >
                                    {loading ? 'Verifying...' : 'Enable MFA'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {step === 'active' && (
                    <div className="space-y-6 text-center">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle size={32} className="text-green-600" />
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-xl">MFA is Active</h4>
                            <p className="text-gray-600 mt-2">
                                Your account is now protected with two-factor authentication.
                            </p>
                        </div>
                        <div className="pt-4 flex flex-col gap-3">
                            <button 
                                onClick={disableMfa}
                                className="btn btn-outline-danger flex items-center justify-center gap-2"
                            >
                                <XCircle size={18} />
                                Disable MFA
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MfaSetup;
