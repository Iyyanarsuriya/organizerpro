import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster, useToasterStore, toast } from 'react-hot-toast';
import { getReminders } from './api/Reminder/personalReminder';
import { updateProfile, getMe } from './api/authApi';

// Components
import Navbar from './components/layout/Navbar';
import GlobalModals from './components/modals/GlobalModals';

// Pages (Lazy Loaded)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Home = lazy(() => import('./pages/PersonalSector/PersonalHome'));
const PersonalSectorHome = lazy(() => import('./pages/PersonalSector/PersonalDashboard')); // New Personal Dashboard
const PersonalReminders = lazy(() => import('./pages/PersonalSector/PersonalReminders')); // Specific Personal Reminders
const ReminderDashboard = lazy(() => import('./pages/PersonalSector/ReminderDashboard')); // Reminder Dashboard
const PersonalExpenseTracker = lazy(() => import('./pages/PersonalSector/PersonalExpenseTracker')); // New Personal Expenses

const ITHome = lazy(() => import('./pages/ITSector/ITHome'));
const ITExpenseTracker = lazy(() => import('./pages/ITSector/ITExpenseTracker'));

const ITReminders = lazy(() => import('./pages/ITSector/ITReminders'));
const ITAttendance = lazy(() => import('./pages/ITSector/ITAttendance'));
const ITTeamManagement = lazy(() => import('./pages/ITSector/Team/ITTeamManagement'));
const ITReminderDashboard = lazy(() => import('./pages/ITSector/ITReminderDashboard'));


const Reminders = lazy(() => import('./pages/ManufacturingSector/ReminderTracker/Reminders'));

const ExpenseTracker = lazy(() => import('./pages/ManufacturingSector/ExpenseTracker/ExpenseTrackerMain'));
const AttendanceTracker = lazy(() => import('./pages/ManufacturingSector/AttendanceTracker/AttendanceTracker'));
const TeamManagement = lazy(() => import('./pages/ManufacturingSector/Team/TeamManagement'));
const ManufacturingPayroll = lazy(() => import('./pages/ManufacturingSector/Payroll/ManufacturingPayroll'));
const ManufacturingHome = lazy(() => import('./pages/ManufacturingSector/ManufacturingHome'));
const EducationHome = lazy(() => import('./pages/EducationSector/EducationHome'));
const EducationReminders = lazy(() => import('./pages/EducationSector/EducationReminders'));
const EducationReminderDashboard = lazy(() => import('./pages/EducationSector/EducationReminderDashboard'));
const EducationAttendance = lazy(() => import('./pages/EducationSector/EducationAttendance'));
const EducationExpenses = lazy(() => import('./pages/EducationSector/EducationExpenses'));
const EducationTeam = lazy(() => import('./pages/EducationSector/EducationTeam'));
const HotelHome = lazy(() => import('./pages/HotelSector/HotelHome'));
const HotelExpenses = lazy(() => import('./pages/HotelSector/HotelExpenses'));
const HotelReminders = lazy(() => import('./pages/HotelSector/HotelReminders'));
const HotelAttendance = lazy(() => import('./pages/HotelSector/HotelAttendance'));
const HotelTeam = lazy(() => import('./pages/HotelSector/HotelTeam'));
const HotelBookings = lazy(() => import('./pages/HotelSector/HotelBookings'));
const HotelUnits = lazy(() => import('./pages/HotelSector/HotelUnits'));
const HotelGuests = lazy(() => import('./pages/HotelSector/HotelGuests'));
const HotelOperations = lazy(() => import('./pages/HotelSector/HotelOperations'));
const HotelSettings = lazy(() => import('./pages/HotelSector/HotelSettings'));
const Notes = lazy(() => import('./pages/Notes/Notes'));
const ForgotPassword = lazy(() => import('./pages/Authentication/ForgotPassword'));

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
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
  const [token, setToken] = useState(localStorage.getItem('token'));
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
      // Ensure res.data is an array before setting state
      setReminders(Array.isArray(res.data) ? res.data : []);
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

      const handleRefresh = () => fetchTodayReminders();
      window.addEventListener('refresh-reminders', handleRefresh);

      return () => {
        clearInterval(interval);
        window.removeEventListener('refresh-reminders', handleRefresh);
      };
    }
  }, [token]);

  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('token');
      const newUser = localStorage.getItem('user');
      setToken(newToken);
      if (newUser) setUser(JSON.parse(newUser));
      if (!newToken) setUser(null);
    };

    const handleRefreshReminders = () => fetchTodayReminders();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('refresh-reminders', handleRefreshReminders);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('refresh-reminders', handleRefreshReminders);
    };
  }, [token]);

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
        onLogout={handleLogout}
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

      <main className="pt-[72px] sm:pt-[80px] overflow-x-hidden">
        <Suspense fallback={
          <div className="min-h-[60vh] flex items-center justify-center bg-[#f8fafc]">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={token ? <Home onProfileClick={() => setShowProfileModal(true)} /> : <LandingPage onSignupClick={() => setShowSignupModal(true)} />} />

            {/* Personal Sector Routes */}
            <Route path="/personal" element={<ProtectedRoute><PersonalSectorHome /></ProtectedRoute>} />
            <Route path="/personal/reminders" element={<ProtectedRoute><PersonalReminders /></ProtectedRoute>} />
            <Route path="/reminder-dashboard" element={<ProtectedRoute><ReminderDashboard /></ProtectedRoute>} />
            <Route path="/personal/expenses" element={<ProtectedRoute><PersonalExpenseTracker /></ProtectedRoute>} />

            {/* IT Sector Routes */}
            <Route path="/it-sector" element={<ProtectedRoute><ITHome /></ProtectedRoute>} />
            <Route path="/it-sector/reminders" element={<ProtectedRoute><ITReminders /></ProtectedRoute>} />
            <Route path="/it-sector/reminder-dashboard" element={<ProtectedRoute><ITReminderDashboard /></ProtectedRoute>} />

            <Route path="/it-sector/attendance" element={<ProtectedRoute><ITAttendance /></ProtectedRoute>} />
            <Route path="/it-sector/team" element={<ProtectedRoute><ITTeamManagement /></ProtectedRoute>} />
            <Route path="/it-sector/expenses" element={<ProtectedRoute><ITExpenseTracker /></ProtectedRoute>} />


            <Route path="/manufacturing" element={<ProtectedRoute><ManufacturingHome /></ProtectedRoute>} />
            <Route path="/manufacturing/reminders" element={<ProtectedRoute><Reminders /></ProtectedRoute>} />
            <Route path="/manufacturing/expenses" element={<ProtectedRoute><ExpenseTracker /></ProtectedRoute>} />
            <Route path="/manufacturing/attendance" element={<ProtectedRoute><AttendanceTracker /></ProtectedRoute>} />
            <Route path="/manufacturing/team" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
            <Route path="/manufacturing/payroll" element={<ProtectedRoute><ManufacturingPayroll /></ProtectedRoute>} />

            {/* Education Sector Routes */}
            <Route path="/education-sector" element={<ProtectedRoute><EducationHome /></ProtectedRoute>} />
            <Route path="/education-sector/reminders" element={<ProtectedRoute><EducationReminders /></ProtectedRoute>} />
            <Route path="/education-sector/reminder-dashboard" element={<ProtectedRoute><EducationReminderDashboard /></ProtectedRoute>} />
            <Route path="/education-sector/attendance" element={<ProtectedRoute><EducationAttendance /></ProtectedRoute>} />
            <Route path="/education-sector/expenses" element={<ProtectedRoute><EducationExpenses /></ProtectedRoute>} />
            <Route path="/education-sector/team" element={<ProtectedRoute><EducationTeam /></ProtectedRoute>} />

            {/* Hotel Sector Routes */}
            <Route path="/hotel-sector" element={<ProtectedRoute><HotelHome /></ProtectedRoute>} />
            <Route path="/hotel-sector/expenses" element={<ProtectedRoute><HotelExpenses /></ProtectedRoute>} />
            <Route path="/hotel-sector/reminders" element={<ProtectedRoute><HotelReminders /></ProtectedRoute>} />
            <Route path="/hotel-sector/attendance" element={<ProtectedRoute><HotelAttendance /></ProtectedRoute>} />
            <Route path="/hotel-sector/team" element={<ProtectedRoute><HotelTeam /></ProtectedRoute>} />
            <Route path="/hotel-sector/bookings" element={<ProtectedRoute><HotelBookings /></ProtectedRoute>} />
            <Route path="/hotel-sector/units" element={<ProtectedRoute><HotelUnits /></ProtectedRoute>} />
            <Route path="/hotel-sector/guests" element={<ProtectedRoute><HotelGuests /></ProtectedRoute>} />
            <Route path="/hotel-sector/ops" element={<ProtectedRoute><HotelOperations /></ProtectedRoute>} />
            <Route path="/hotel-sector/settings" element={<ProtectedRoute><HotelSettings /></ProtectedRoute>} />


            <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
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

// End of App
export default App;
