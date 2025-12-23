import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, verifyOTP, resetPasswordWithOTP } from '../api/authApi';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await forgotPassword(email);
            toast.success(response.data.message);
            setStep(2);
            if (response.data.testOTP) {
                console.log("TEST OTP (Dev):", response.data.testOTP);
                toast('Check console for test OTP', { icon: '🐛' });
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await verifyOTP(email, otp);
            toast.success('OTP verified successfully!');
            setStep(3);
        } catch (error) {
            toast.error(error.response?.data?.error || "Invalid or expired OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            await resetPasswordWithOTP(email, otp, password);
            toast.success("Password reset successful! Please login.");
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        try {
            const response = await forgotPassword(email);
            toast.success('New OTP sent to your email!');
            if (response.data.testOTP) {
                console.log("TEST OTP (Dev):", response.data.testOTP);
                toast('Check console for test OTP', { icon: '🐛' });
            }
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to resend OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="glass w-full max-w-sm sm:max-w-md p-6 sm:p-8 rounded-4xl shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <h2 className="text-3xl font-black text-center text-slate-800">
                        {step === 1 && 'Forgot Password?'}
                        {step === 2 && 'Verify OTP'}
                        {step === 3 && 'Reset Password'}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1 font-medium text-center">
                        {step === 1 && 'Enter your email to receive OTP'}
                        {step === 2 && 'Enter the 6-digit code sent to your email'}
                        {step === 3 && 'Create a new strong password'}
                    </p>
                </div>

                {/* Step 1: Email Input */}
                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-500 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-800 input-focus font-medium placeholder:text-slate-300"
                                placeholder="lilyamber@gmail.com"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full bg-[#1a1c21] hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                        >
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-500 mb-2">Enter OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-800 input-focus font-medium placeholder:text-slate-300 text-center text-2xl tracking-widest"
                                placeholder="000000"
                                maxLength="6"
                                required
                            />
                            <p className="text-xs text-slate-400 mt-2 text-center">
                                OTP sent to <span className="font-semibold text-slate-600">{email}</span>
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full bg-[#1a1c21] hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                        >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={handleResendOTP}
                                disabled={loading}
                                className="text-[#2d5bff] font-bold hover:underline text-sm disabled:opacity-50"
                            >
                                Resend OTP
                            </button>
                            <span className="mx-2 text-slate-300">|</span>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="text-slate-500 font-bold hover:underline text-sm"
                            >
                                Change Email
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 3: New Password */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-500 mb-2">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-800 input-focus font-medium placeholder:text-slate-300"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-500 mb-2">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-800 input-focus font-medium placeholder:text-slate-300"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1a1c21] hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <p className="mt-8 text-center text-slate-400 text-sm font-medium">
                    Remember your password?{' '}
                    <Link to="/login" className="text-[#2d5bff] hover:underline font-black">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
