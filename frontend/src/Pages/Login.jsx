// Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';
import { forgotPassword, verifyOTP, resetPassword } from '@/utils/api';
import { toast } from 'react-hot-toast';
import OTPInput from '@/components/auth/OTPInput';

export default function Login() {
    const { login, isLoadingAuth, authError } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    
    // Forgot Password Flow States
    const [view, setView] = useState('login'); // 'login', 'forgot-email', 'forgot-otp', 'forgot-reset'
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendDisabled, setResendDisabled] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetEmail, setResetEmail] = useState('');

    // Real-time email validation
    const validateEmail = (value) => {
        if (!value) {
            setEmailError('Email is required');
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(value)) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError('');
        return true;
    };

    // Real-time password validation
    const validatePassword = (value) => {
        if (!value) {
            setPasswordError('Password is required');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const handleEmailChange = (e) => {
        const value = e.target.value.toLowerCase(); // Convert to lowercase
        setEmail(value);
        validateEmail(value);
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        validatePassword(value);
    };

    const handleForgotPasswordRequest = async (e) => {
        e.preventDefault();
        if (!validateEmail(email)) return;
        
        setOtpLoading(true);
        try {
            const response = await forgotPassword(email);
            if (response.success) {
                setResetEmail(email);
                setView('forgot-otp');
                startResendTimer();
                toast.success('Reset code sent to your email');
            }
        } catch (error) {
            toast.error(error.error || 'Failed to send reset code');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOTP = async (otpCode) => {
        setOtpLoading(true);
        try {
            const response = await verifyOTP(resetEmail, otpCode);
            if (response.success) {
                setView('forgot-reset');
                toast.success('Identity verified');
            }
        } catch (error) {
            toast.error(error.error || 'Invalid or expired code');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleFinalReset = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }
        
        setOtpLoading(true);
        try {
            const response = await resetPassword(resetEmail, newPassword);
            if (response.success) {
                toast.success('Password reset successfully! Please login.');
                setView('login');
                setPassword(''); // Clear old password
            }
        } catch (error) {
            toast.error(error.error || 'Failed to reset password');
        } finally {
            setOtpLoading(false);
        }
    };

    const startResendTimer = () => {
        setResendDisabled(true);
        setCountdown(60);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setResendDisabled(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleResendOTP = async () => {
        if (resendDisabled) return;
        setOtpLoading(true);
        try {
            await forgotPassword(resetEmail);
            toast.success('New code sent');
            startResendTimer();
        } catch (error) {
            toast.error('Failed to resend code');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);
        
        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        const result = await login(email, password);

        if (result.success) {
            // Redirect based on user role
            if (result.user.role === 'company') {
                navigate(createPageUrl('CompanyDashboard'));
            } else if (result.user.role === 'admin') {
                navigate(createPageUrl('AdminDashboard'));
            } else {
                navigate(createPageUrl('Dashboard'));
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full"
            >
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-xl">
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C63FF] to-[#8B85FF] flex items-center justify-center mx-auto mb-4 shadow-lg"
                        >
                            <Sparkles className="w-8 h-8 text-white" />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                        <p className="text-gray-500 mt-1">Sign in to continue your journey</p>
                    </div>

                    {view === 'login' && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <Label htmlFor="email" className="text-gray-700">Email</Label>
                            <div className="relative mt-1.5">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={handleEmailChange}
                                    className={`pl-10 rounded-xl ${emailError ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    required
                                />
                            </div>
                            {emailError && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-red-500 mt-1"
                                >
                                    {emailError}
                                </motion.p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="password" className="text-gray-700">Password</Label>
                            <div className="relative mt-1.5">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    className={`pl-10 pr-10 rounded-xl ${passwordError ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {passwordError && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-red-500 mt-1"
                                >
                                    {passwordError}
                                </motion.p>
                            )}
                        </div>

                        {authError && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm"
                            >
                                {authError.message}
                            </motion.div>
                        )}

                        <div className="flex justify-end">
                            <button 
                                type="button"
                                onClick={() => setView('forgot-email')}
                                className="text-xs text-[#6C63FF] font-medium hover:underline"
                            >
                                Forgot password?
                            </button>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoadingAuth}
                            className="w-full bg-gradient-to-r from-[#6C63FF] to-[#8B85FF] text-white rounded-xl py-6 hover:shadow-lg transition-all duration-300"
                        >
                            {isLoadingAuth ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Signing in...
                                </div>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>
                    )}

                    {/* Forgot Password Phase 1: Email */}
                    {view === 'forgot-email' && (
                        <div>
                            <button 
                                onClick={() => setView('login')}
                                className="mb-6 flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
                            </button>
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
                                <p className="text-gray-500 mt-1">Enter your email to receive a 4-digit security code</p>
                            </div>
                            <form onSubmit={handleForgotPasswordRequest} className="space-y-5">
                                <div>
                                    <Label htmlFor="reset-email">Your Email</Label>
                                    <Input
                                        id="reset-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={handleEmailChange}
                                        className="rounded-xl mt-1.5"
                                        required
                                    />
                                </div>
                                <Button 
                                    type="submit" 
                                    disabled={otpLoading}
                                    className="w-full bg-[#6C63FF] text-white rounded-xl py-6"
                                >
                                    {otpLoading ? "Sending Code..." : "Send Security Code"}
                                </Button>
                            </form>
                        </div>
                    )}

                    {/* Forgot Password Phase 2: OTP */}
                    {view === 'forgot-otp' && (
                        <div className="space-y-6">
                            <button 
                                onClick={() => setView('forgot-email')}
                                className="mb-6 flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" /> Change Email
                            </button>
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="w-8 h-8 text-[#6C63FF]" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900">Verify Identity</h1>
                                <p className="text-gray-500 mt-2 text-sm leading-relaxed px-4">
                                    We sent a 4-digit code to <span className="font-semibold text-gray-700">{resetEmail}</span>. 
                                    Please enter it below.
                                </p>
                            </div>
                            
                            <OTPInput onComplete={handleVerifyOTP} loading={otpLoading} />

                            <div className="text-center">
                                <p className="text-sm text-gray-500">
                                    Didn't receive the code?{' '}
                                    <button 
                                        onClick={handleResendOTP}
                                        disabled={resendDisabled}
                                        className={`font-semibold ${resendDisabled ? 'text-gray-300' : 'text-[#6C63FF] hover:underline'}`}
                                    >
                                        {resendDisabled ? `Resend in ${countdown}s` : 'Resend OTP'}
                                    </button>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Forgot Password Phase 3: New Password */}
                    {view === 'forgot-reset' && (
                        <div>
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                                    <KeyRound className="w-8 h-8 text-green-500" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900">New Password</h1>
                                <p className="text-gray-500 mt-1">Set a strong password for your account</p>
                            </div>
                            <form onSubmit={handleFinalReset} className="space-y-5">
                                <div>
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="rounded-xl mt-1.5"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="confirm-password">Confirm Password</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="rounded-xl mt-1.5"
                                        required
                                    />
                                </div>
                                <Button 
                                    type="submit" 
                                    disabled={otpLoading}
                                    className="w-full bg-[#6C63FF] text-white rounded-xl py-6"
                                >
                                    {otpLoading ? "Resetting..." : "Reset Password"}
                                </Button>
                            </form>
                        </div>
                    )}

                    {view === 'login' && (
                        <p className="text-center text-sm text-gray-500 mt-6">
                            Don't have an account?{' '}
                            <Link to={createPageUrl('Register')} className="text-[#6C63FF] font-medium hover:underline">
                                Create an account
                            </Link>
                        </p>
                    )}
                </div>
            </motion.div>
        </div>
    );
}