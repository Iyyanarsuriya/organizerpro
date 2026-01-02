import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api/authApi';
import toast from 'react-hot-toast';

const Signup = ({ onClose, onSwitch }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobile_number, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const fieldErrors = {};

    if (!username) fieldErrors.username = "Username is required";
    if (!email) fieldErrors.email = "Email is required";
    else if (!isValidEmail(email)) fieldErrors.email = "Invalid email address";

    if (!password) fieldErrors.password = "Password is required";
    else if (password.length < 6)
      fieldErrors.password = "Password must be at least 6 characters";

    if (!confirmPassword) fieldErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword)
      fieldErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      toast.error(Object.values(fieldErrors)[0]);
      return;
    }

    try {
      setLoading(true);
      await signup({ username, email, password, mobile_number });
      toast.dismiss();
      toast.success("Account created successfully!");
      if (onSwitch) {
        onSwitch(); // Go to login after signup
      } else {
        navigate('/login');
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass w-full min-h-full p-[24px] sm:p-[40px] relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-20 h-20 mb-4">
          <div className="absolute inset-0 bg-linear-to-br from-emerald-400 to-teal-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/30"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        </div>
        <h2 className="text-3xl font-black text-center text-slate-800">
          Nice to see you!
        </h2>
        <p className="text-slate-400 text-sm mt-1 font-medium text-center">Create your account</p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1 ml-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (errors.username) setErrors({ ...errors, username: null });
            }}
            className={`w-full bg-slate-50 border ${errors.username ? 'border-red-500' : 'border-slate-200'} rounded-2xl px-4 py-3 text-slate-800 input-focus font-medium placeholder:text-slate-300`}
            placeholder="Suriya"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1 ml-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: null });
            }}
            className={`w-full bg-slate-50 border ${errors.email ? 'border-red-500' : 'border-slate-200'} rounded-2xl px-4 py-3 text-slate-800 input-focus font-medium placeholder:text-slate-300`}
            placeholder="suriya@gmail.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1 ml-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: null });
              }}
              className={`w-full bg-slate-50 border ${errors.password ? 'border-red-500' : 'border-slate-200'} rounded-2xl px-4 py-3 pr-12 text-slate-800 input-focus font-medium placeholder:text-slate-300`}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-500 mb-1 ml-1">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: null });
              }}
              className={`w-full bg-slate-50 border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-200'} rounded-2xl px-4 py-3 pr-12 text-slate-800 input-focus font-medium placeholder:text-slate-300`}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showConfirmPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1a1c21] hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl mt-2"
        >
          {loading ? 'Creating account...' : 'Create my account'}
        </button>
      </form>

      <p className="mt-8 text-center text-slate-400 text-sm font-medium">
        Already have an account?{' '}
        <button
          onClick={onSwitch}
          className="text-[#2d5bff] hover:underline font-black cursor-pointer"
        >
          Sign in
        </button>
      </p>
    </div>
  );
};

export default Signup;
