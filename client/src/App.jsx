import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import Home from './pages/Home';
import Profile from './pages/Profile';
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
  const authRoutes = ['/login', '/signup', '/forgot-password'];
  const isAuthRoute = authRoutes.includes(location.pathname) || location.pathname.startsWith('/reset-password/');

  return (
    <>
      {token && !isAuthRoute && (
        <header className="fixed top-0 left-0 w-full z-50 border-b border-white/50 glass">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 sm:h-20">
              {/* Logo Section */}
              <div className="flex items-center gap-2">
                <Link to="/" className="flex items-center gap-2 group">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#2d5bff] rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-lg sm:text-xl font-black text-slate-800 tracking-tighter">
                    Reminder<span className="text-[#2d5bff]">App</span>
                  </span>
                </Link>
              </div>

              {/* Navigation Links */}
              <nav className="flex items-center gap-3 sm:gap-8">
                <Link to="/" className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-slate-500 hover:text-[#2d5bff] transition-all duration-300 relative group hidden xs:block">
                  Home
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#2d5bff] transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/profile" className="px-4 sm:px-6 py-2 sm:py-2.5 bg-[#1a1c21] hover:bg-slate-800 text-white text-[10px] sm:text-xs font-black tracking-widest uppercase rounded-full shadow-lg transition-all active:scale-95 whitespace-nowrap">
                  Profile
                </Link>
              </nav>
            </div>
          </div>
        </header>
      )}

      <main className={token && !isAuthRoute ? "min-h-[calc(100vh-5rem)] mt-16 sm:mt-20" : ""}>
        <Routes>
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
