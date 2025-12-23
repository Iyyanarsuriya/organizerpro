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
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
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
        <header className="fixed top-0 left-0 w-full z-50 border-b border-white glass">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              {/* Logo Section */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[#2d5bff] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xl font-black text-slate-800 hidden sm:block">
                  Reminder<span className="text-[#2d5bff]">App</span>
                </span>
              </div>

              {/* Navigation Links */}
              <nav className="flex items-center gap-8">
                <Link to="/" className="text-xs font-black tracking-widest uppercase text-slate-500 hover:text-[#2d5bff] transition-all duration-300 relative group">
                  Home
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#2d5bff] transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link to="/profile" className="px-6 py-2.5 bg-[#1a1c21] hover:bg-slate-800 text-white text-xs font-black tracking-widest uppercase rounded-full shadow-lg transition-all active:scale-95">
                  Profile
                </Link>
              </nav>
            </div>
          </div>
        </header>
      )}

      <main className={token && !isAuthRoute ? "lg:h-[calc(100vh-5rem)] mt-20 lg:overflow-hidden min-h-[calc(100vh-5rem)]" : ""}>
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
