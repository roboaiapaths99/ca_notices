import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Shield, Eye, EyeOff } from 'lucide-react';
import './Login.css';

const Login = () => {
    const { login, register, ssoLogin, verifyMfa } = useAuth();
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        tenantName: '',
        tenantSlug: '',
    });

    const [mfaChallenge, setMfaChallenge] = useState(false);
    const [mfaUserId, setMfaUserId] = useState(null);
    const [mfaToken, setMfaToken] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleMfaSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await verifyMfa(mfaUserId, mfaToken);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid MFA code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isRegister) {
                await register(form);
                navigate('/dashboard');
            } else {
                const result = await login(form.email, form.password);
                if (result?.mfaRequired) {
                    setMfaChallenge(true);
                    setMfaUserId(result.userId);
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                {/* Left: Branding */}
                <div className="login-branding">
                    <div className="branding-content">
                        <div className="branding-logo">
                            <div className="branding-logo-icon">NR</div>
                            <h1>NoticeRadar<span>Enterprise</span></h1>
                        </div>
                        <p className="branding-tagline">
                            Enterprise-grade Income Tax, GST & TDS Notice Management
                        </p>
                        <div className="branding-features">
                            <div className="feature-item">
                                <Shield size={20} />
                                <span>Multi-tenant secure platform</span>
                            </div>
                            <div className="feature-item">
                                <Shield size={20} />
                                <span>Response Studio with PDF generation</span>
                            </div>
                            <div className="feature-item">
                                <Shield size={20} />
                                <span>Automated deadline tracking & reminders</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Form */}
                <div className="login-form-container">
                    <div className="login-form-wrapper">
                        <h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2>
                        <p className="login-subtitle">
                            {isRegister
                                ? 'Set up your firm on NoticeRadar Enterprise'
                                : 'Sign in to your NoticeRadar account'
                            }
                        </p>

                        {error && (
                            <div className="login-error">
                                {error}
                            </div>
                        )}

                        {mfaChallenge ? (
                            <form onSubmit={handleMfaSubmit} className="login-form">
                                <div className="text-center mb-6">
                                    <div className="mfa-icon-container">
                                        <Shield size={48} className="text-primary-600 mx-auto" />
                                    </div>
                                    <h3 className="text-xl font-bold mt-4">Two-Step Verification</h3>
                                    <p className="text-gray-500 text-sm mt-2">
                                        Enter the 6-digit code from your authenticator app to continue.
                                    </p>
                                </div>

                                <div className="input-group">
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={mfaToken}
                                        onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, ''))}
                                        className="input text-center text-3xl tracking-[1rem] font-bold h-16"
                                        placeholder="000000"
                                        autoFocus
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg login-submit"
                                    disabled={loading || mfaToken.length !== 6}
                                >
                                    {loading && <div className="spinner"></div>}
                                    Verify & Sign In
                                </button>

                                <button 
                                    type="button"
                                    className="btn-link mt-4 w-full text-center text-sm"
                                    onClick={() => {
                                        setMfaChallenge(false);
                                        setMfaToken('');
                                    }}
                                >
                                    Cancel
                                </button>
                            </form>
                        ) : (
                            <>
                                <form onSubmit={handleSubmit} className="login-form">
                                    {isRegister && (
                                        <>
                                            {/* ... (keep existing register fields) ... */}
                                        <div className="form-row">
                                            <div className="input-group">
                                                <label htmlFor="firstName">First Name</label>
                                                <input
                                                    id="firstName"
                                                    name="firstName"
                                                    className="input"
                                                    value={form.firstName}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Enter first name"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label htmlFor="lastName">Last Name</label>
                                                <input
                                                    id="lastName"
                                                    name="lastName"
                                                    className="input"
                                                    value={form.lastName}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Enter last name"
                                                />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label htmlFor="tenantName">Firm Name</label>
                                            <input
                                                id="tenantName"
                                                name="tenantName"
                                                className="input"
                                                value={form.tenantName}
                                                onChange={handleChange}
                                                required
                                                placeholder="e.g. ABC & Associates"
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label htmlFor="tenantSlug">Firm Slug</label>
                                            <input
                                                id="tenantSlug"
                                                name="tenantSlug"
                                                className="input"
                                                value={form.tenantSlug}
                                                onChange={handleChange}
                                                required
                                                placeholder="e.g. abc-associates"
                                                pattern="[a-z0-9-]+"
                                                title="Lowercase letters, numbers, and hyphens only"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="input-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        className="input"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                    />
                                </div>

                                <div className="input-group">
                                    <label htmlFor="password">Password</label>
                                    <div className="password-wrapper">
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            className="input"
                                            value={form.password}
                                            onChange={handleChange}
                                            required
                                            placeholder="Enter password"
                                            minLength={isRegister ? 8 : 1}
                                            autoComplete={isRegister ? 'new-password' : 'current-password'}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg login-submit"
                                    disabled={loading}
                                >
                                    {loading && <div className="spinner"></div>}
                                    {isRegister ? 'Create Account' : 'Sign In'}
                                </button>
                            </form>

                            <div className="login-divider">
                                <span>or</span>
                            </div>

                            <button
                                type="button"
                                className="btn btn-secondary btn-lg sso-btn"
                                onClick={ssoLogin}
                            >
                                <Shield size={18} />
                                Login with SSO (Keycloak)
                            </button>

                            <p className="login-toggle">
                                {isRegister ? (
                                    <>Already have an account? <button onClick={() => setIsRegister(false)}>Sign in</button></>
                                ) : (
                                    <>Don't have an account? <button onClick={() => setIsRegister(true)}>Register your firm</button></>
                                )}
                            </p>
                        </>
                    ) }</div>
                </div>
            </div>
        </div>
    );
};

export default Login;
