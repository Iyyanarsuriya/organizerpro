import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/authApi';
import toast from 'react-hot-toast';

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');

    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(atob(savedPassword)); // Decode from base64
      setRememberMe(true);
    }
  }, []);

  const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSignIn = async (e) => {
    if (e) e.preventDefault();
    const fieldErrors = {};

    if (!email) fieldErrors.email = "Email is required";
    else if (!isValidEmail(email)) fieldErrors.email = "Invalid email address";

    if (!password) fieldErrors.password = "Password is required";
    else if (password.length < 6)
      fieldErrors.password = "Password must be at least 6 characters";

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      toast.error(Object.values(fieldErrors)[0]);
      return;
    }

    try {
      setLoading(true);
      const response = await login({ email, password });

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberedPassword', btoa(password)); // Encode to base64
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
      }

      setToken(token);
      toast.success("Login successful");

      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="glass w-full max-w-sm sm:max-w-md p-6 sm:p-8 rounded-4xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-20 h-20 mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2d5bff] to-[#1a3dbf] rounded-2xl rotate-45 animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-black text-center text-slate-800">
            Hello Again!
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-medium">Log into your account</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: null });
              }}
              className={`w-full bg-slate-50 border ${errors.email ? 'border-red-500' : 'border-slate-200'} rounded-2xl px-4 py-4 text-slate-800 input-focus font-medium placeholder:text-slate-300`}
              placeholder="lilyamber@gmail.com"
              required
            />
            {errors.email && <p className="text-red-500 text-xs mt-1 px-2 font-medium">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-500 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: null });
              }}
              className={`w-full bg-slate-50 border ${errors.password ? 'border-red-500' : 'border-slate-200'} rounded-2xl px-4 py-4 text-slate-800 input-focus font-medium placeholder:text-slate-300`}
              placeholder="••••••••"
              required
            />
            {errors.password && <p className="text-red-500 text-xs mt-1 px-2 font-medium">{errors.password}</p>}
          </div>

          <div className="flex justify-between items-center px-1">
            <label className="flex items-center gap-2 cursor-pointer group text-xs text-slate-400 font-semibold">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded-md border-slate-300 text-[#2d5bff] focus:ring-[#2d5bff]"
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-xs text-[#2d5bff] font-bold hover:underline">Forgot password?</Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a1c21] hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400 text-sm font-medium">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#2d5bff] hover:underline font-black">
            Register Now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
