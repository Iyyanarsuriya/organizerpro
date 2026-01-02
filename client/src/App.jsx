import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster, useToasterStore, toast } from 'react-hot-toast';
import { getReminders } from './api/homeApi';
import { updateProfile, getMe } from './api/authApi';

// Components
import Navbar from './components/layout/Navbar';
import GlobalModals from './components/modals/GlobalModals';

// Pages
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import Reminders from './pages/Reminders';
import Profile from './pages/Profile';
import FinanceProfile from './pages/FinanceProfile';
import ExpenseTracker from './pages/ExpenseTracker';
import ForgotPassword from './pages/ForgotPassword';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return children;
};

// Toast Limiter Component
const ToastLimiter = () => {
  const { toasts } = useToasterStore();
  const TOAST_LIMIT = 1;

  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .filter((_, i) => i >= TOAST_LIMIT)
      .forEach((t) => toast.dismiss(t.id));
  }, [toasts]);

  return null;
};

const AppContent = () => {
  const location = useLocation();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || sessionStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [reminders, setReminders] = useState([]);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editData, setEditData] = useState({ username: '', mobile_number: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const fetchTodayReminders = async () => {
    if (!token) return;
    try {
      const res = await getReminders();
      setReminders(res.data || []);
    } catch (error) {
      console.error("Failed to fetch reminders for header", error);
    }
  };

  const fetchUserData = async () => {
    if (!token) return;
    try {
      const res = await getMe();
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (error) {
      console.error("Failed to fetch user data", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserData();
      fetchTodayReminders();
      const interval = setInterval(fetchTodayReminders, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      const newUser = localStorage.getItem('user');
      setToken(newToken);
      if (newUser) setUser(JSON.parse(newUser));
      if (!newToken) setUser(null);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setToken(null);
    setShowProfileModal(false);
    window.dispatchEvent(new Event('storage'));
    toast.success("Logged out successfully");
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const formData = new FormData();
      formData.append('username', editData.username);
      formData.append('mobile_number', editData.mobile_number || '');
      if (selectedFile) {
        formData.append('profile_image', selectedFile);
      }

      const response = await updateProfile(formData);
      const updatedUser = {
        ...user,
        ...editData,
        profile_image: response.data.profile_image || user.profile_image
      };

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setIsEditingProfile(false);
      setSelectedFile(null);
      setPreviewImage(null);
      toast.success("Profile updated!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Update failed");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const todayReminders = reminders.filter(r => {
    if (r.is_completed) return false;
    const today = new Date().toISOString().split('T')[0];
    return r.due_date && r.due_date.startsWith(today);
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] overflow-x-hidden selection:bg-blue-500/30">
      <ToastLimiter />
      <Toaster position="top-center" reverseOrder={false} />

      <Navbar
        user={user}
        token={token}
        todayReminders={todayReminders}
        onLoginClick={() => setShowLoginModal(true)}
        onSignupClick={() => setShowSignupModal(true)}
        onProfileClick={() => setShowProfileModal(true)}
      />

      <GlobalModals
        showLoginModal={showLoginModal}
        setShowLoginModal={setShowLoginModal}
        showSignupModal={showSignupModal}
        setShowSignupModal={setShowSignupModal}
        showProfileModal={showProfileModal}
        setShowProfileModal={setShowProfileModal}
        isEditingProfile={isEditingProfile}
        setIsEditingProfile={setIsEditingProfile}
        editData={editData}
        setEditData={setEditData}
        updatingProfile={updatingProfile}
        handleUpdateProfile={handleUpdateProfile}
        handleFileChange={handleFileChange}
        previewImage={previewImage}
        setPreviewImage={setPreviewImage}
        user={user}
        handleLogout={handleLogout}
        setToken={setToken}
      />

      <main className="pt-[72px] sm:pt-[80px]">
        <Routes>
          <Route path="/" element={token ? <Home /> : <LandingPage onSignupClick={() => setShowSignupModal(true)} />} />
          <Route path="/reminders" element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><FinanceProfile /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><ExpenseTracker /></ProtectedRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
