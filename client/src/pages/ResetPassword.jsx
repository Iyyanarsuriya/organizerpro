import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../api/authApi';
import toast from 'react-hot-toast';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
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
            await resetPassword(token, password);
            toast.success("Password reset successful! Please login.");
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to reset password. Link may be expired.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="glass w-full max-w-sm sm:max-w-md p-6 sm:p-8 rounded-4xl shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="relative w-20 h-20 mb-4">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl rotate-45 animate-pulse shadow-lg shadow-orange-500/30"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-center text-slate-800">
                        Reset Password
                    </h2>
                    <p className="text-slate-400 text-sm mt-1 font-medium">
                        Create a new strong password
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                        {loading ? 'Reseting...' : 'Reset Password'}
                    </button>
                </form>

                <p className="mt-8 text-center text-slate-400 text-sm font-medium">
                    <Link to="/login" className="text-[#2d5bff] hover:underline font-black">
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ResetPassword;
