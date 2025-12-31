import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Toaster, useToasterStore, toast } from 'react-hot-toast';

// Component to limit visible toasts to 1
const ToastLimiter = () => {
  const { toasts } = useToasterStore();
  useEffect(() => {
    toasts
      .filter((t) => t.visible) // Only check visible toasts
      .filter((_, i) => i >= 1) // Allow only 1 toast
      .forEach((t) => toast.dismiss(t.id)); // Dismiss others
  }, [toasts]);
  return null;
};

// Pages
import Home from './pages/Home';
import Reminders from './pages/Reminders';
import ExpenseTracker from './pages/ExpenseTracker';
import Profile from './pages/Profile';
import FinanceProfile from './pages/FinanceProfile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || sessionStorage.getItem('token'));

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Router>
      <ToastLimiter />
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={12}
        containerStyle={{
          top: 40,
          left: 20,
          bottom: 20,
          right: 20,
        }}
        toastOptions={{
          // Global defaults
          duration: 2000,
          pauseOnHover: false,
          pauseOnFocusLoss: false,
          style: {
            fontFamily: "'Outfit', sans-serif",
            fontWeight: '600',
            fontSize: '14px',
            borderRadius: '16px',
            padding: '12px 20px',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
            maxWidth: '350px',
            width: '90%',
          },
          // Specific type defaults
          success: {
            duration: 2000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 2000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <div className="min-h-screen bg-transparent text-slate-800 tracking-tight">
        <AppContent token={token} setToken={setToken} />
      </div>
    </Router>
  );
}

function AppContent({ token, setToken }) {
  const location = useLocation();
  const navigate = useNavigate();
  const authRoutes = ['/login', '/signup', '/forgot-password'];
  const isAuthRoute = authRoutes.includes(location.pathname) || location.pathname.startsWith('/reset-password/');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || {});

  // Update user when localStorage changes
  useEffect(() => {
    const updateLocalUser = () => setUser(JSON.parse(localStorage.getItem('user')) || {});
    window.addEventListener('storage', updateLocalUser);
    return () => window.removeEventListener('storage', updateLocalUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setShowProfileModal(false);
    toast.success("Signed out successfully");
    navigate('/login');
  };

  const isSubPage = location.pathname === '/reminders' || location.pathname === '/expense-tracker';

  return (
    <>
      {token && !isAuthRoute && (
        <header className="fixed top-0 left-0 w-full z-50 border-b border-white/50 glass animate-in fade-in duration-500">
          <div className="max-w-[1280px] mx-auto px-[12px] sm:px-[24px] lg:px-[32px]">
            <div className="flex justify-between items-center h-[64px] sm:h-[80px]">
              {/* Logo Section */}
              <div className="flex items-center gap-[8px]">
                <Link to="/" className="flex items-center gap-[8px] group transition-all transform hover:scale-105 active:scale-95">
                  <div className="w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] bg-[#2d5bff] rounded-[8px] sm:rounded-[12px] flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:bg-blue-600 transition-all">
                    <svg className="w-[20px] h-[20px] sm:w-[24px] sm:h-[24px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                  <span className="text-[18px] sm:text-[20px] font-black text-slate-800 tracking-tighter">
                    Organizer<span className="text-[#2d5bff]">Pro</span>
                  </span>
                </Link>
              </div>

              {/* Navigation Links */}
              <nav className="flex items-center gap-[12px] sm:gap-[24px]">
                {!isSubPage ? (
                  <div className="flex items-center gap-[12px] sm:gap-[24px] animate-in slide-in-from-right-10 duration-500">
                    <Link to="/" className="text-[10px] sm:text-[12px] font-black tracking-widest uppercase text-slate-800 hover:text-[#2d5bff] transition-all duration-300 relative group hidden xs:block">
                      Home
                      <span className="absolute -bottom-[4px] left-0 w-full h-[2px] bg-[#2d5bff]"></span>
                    </Link>
                    <button
                      onClick={() => setShowProfileModal(true)}
                      className="px-[16px] sm:px-[24px] py-[8px] sm:py-[10px] bg-[#1a1c21] hover:bg-slate-800 text-white text-[10px] sm:text-[12px] font-black tracking-widest uppercase rounded-full shadow-lg transition-all active:scale-95 whitespace-nowrap cursor-pointer hover:shadow-blue-500/20"
                    >
                      Profile
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-[8px] px-[16px] sm:px-[24px] py-[8px] sm:py-[10px] bg-white border border-slate-200 hover:border-[#2d5bff] hover:text-[#2d5bff] text-slate-600 text-[10px] sm:text-[12px] font-black tracking-widest uppercase rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 animate-in slide-in-from-right-10 duration-500 cursor-pointer"
                  >
                    <span>Back to Home</span>
                    <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                )}
              </nav>
            </div>
          </div>
        </header>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-[16px] bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-[400px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white">
            {/* Header */}
            <div className="bg-linear-to-br from-[#2d5bff] to-[#6366f1] p-[32px] text-center relative">
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-[20px] right-[20px] w-[32px] h-[32px] rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all cursor-pointer"
              >
                ×
              </button>
              <div className="w-[100px] h-[100px] rounded-full mx-auto mb-[16px] flex items-center justify-center border-4 border-white shadow-xl overflow-hidden bg-slate-100">
                {user.profile_image ? (
                  <img src={`${API_URL}${user.profile_image}`} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <span className="text-[40px] font-black text-[#2d5bff]">{user.username?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <h3 className="text-white text-[24px] font-black tracking-tight">{user.username}</h3>
              <p className="text-white/70 text-[12px] font-bold uppercase tracking-widest mt-1">User Profile</p>
            </div>

            {/* Content */}
            <div className="p-[32px] space-y-[24px]">
              <div className="space-y-[16px]">
                <div className="flex items-center gap-[16px] p-[16px] bg-slate-50 rounded-[20px] border border-slate-100">
                  <div className="w-[40px] h-[40px] bg-blue-50 rounded-[12px] flex items-center justify-center text-blue-500">
                    <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                    <p className="text-[14px] font-bold text-slate-700">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-[16px] p-[16px] bg-slate-50 rounded-[20px] border border-slate-100">
                  <div className="w-[40px] h-[40px] bg-emerald-50 rounded-[12px] flex items-center justify-center text-emerald-500">
                    <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                    <p className="text-[14px] font-bold text-slate-700">{user.mobile_number || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-4">
                <Link
                  to="/profile"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-[16px] rounded-[20px] text-[12px] font-black uppercase tracking-widest text-center transition-all active:scale-95"
                >
                  Edit Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-500 py-[16px] rounded-[20px] text-[12px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className={token && !isAuthRoute ? "min-h-[calc(100vh-5rem)] mt-[64px] sm:mt-[80px]" : ""}>
        <Routes>
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />

          <Route path="/reminders" element={
            <ProtectedRoute>
              <Reminders />
            </ProtectedRoute>
          } />

          <Route path="/expense-tracker" element={
            <ProtectedRoute>
              <ExpenseTracker />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/finance-profile" element={
            <ProtectedRoute>
              <FinanceProfile />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
