import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getReminders, updateReminder, deleteReminder } from '../api/homeApi';
import { disconnectGoogle, updateProfile, getGoogleAuthUrl, getMe } from '../api/authApi';
import { API_URL } from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { FaGoogle, FaCalendarAlt } from 'react-icons/fa';
import { X, Calendar, Clock, AlertCircle, Trash2 } from 'lucide-react';

const Profile = () => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : { username: '', email: '', mobile_number: '' };
    });
    const [reminders, setReminders] = useState([]);
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
    const [selectedStat, setSelectedStat] = useState({ open: false, title: '', items: [] });
    const [selectedTask, setSelectedTask] = useState(null); // For detailed view
    const [deleteId, setDeleteId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : { username: '', email: '', mobile_number: '' };
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [updating, setUpdating] = useState(false);
    const navigate = useNavigate();

    // Filter stats by date (Default to Today)
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchProfileData = async () => {
        try {
            const [userRes, remindersRes] = await Promise.all([
                getMe(),
                getReminders()
            ]);

            setUser(userRes.data);
            setEditData(userRes.data);
            const fetchedReminders = remindersRes.data;
            setReminders(fetchedReminders);

            // Filter reminders for the selected date
            const filteredReminders = fetchedReminders.filter(r => {
                if (!filterDate) return true;
                if (!r.due_date) return false;
                return r.due_date.startsWith(filterDate);
            });

            const completed = filteredReminders.filter(r => r.is_completed).length;
            setStats({
                total: filteredReminders.length,
                completed: completed,
                pending: filteredReminders.length - completed
            });
        } catch (error) {
            console.error("Error fetching profile", error);
        } finally {
            setLoading(false);
        }
    };

    // Refetch when filterDate changes
    useEffect(() => {
        if (!loading) { // Avoid initial double fetch conflicts
            fetchProfileData();
        }
    }, [filterDate]);


    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const formData = new FormData();
            formData.append('username', editData.username);
            formData.append('email', editData.email);
            formData.append('mobile_number', editData.mobile_number || '');
            if (selectedFile) {
                formData.append('profile_image', selectedFile);
            }

            const response = await updateProfile(formData);

            // Update local user state with new data including image if returned
            const updatedUser = {
                ...user,
                ...editData,
                profile_image: response.data.profile_image || user.profile_image
            };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser)); // Keep user session updated

            // Refresh data from server to be sure
            await fetchProfileData();

            setIsEditing(false);
            setSelectedFile(null);
            setPreviewImage(null);
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error(error.response?.data?.error || "Update failed");
        } finally {
            setUpdating(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        window.dispatchEvent(new Event('storage'));
        toast.success("Logged out successfully", { duration: 1000 });
        navigate('/login');
    };

    useEffect(() => {
        fetchProfileData();

        // Check for google auth status in URL
        const params = new URLSearchParams(window.location.search);
        if (params.get('google') === 'success') {
            toast.success("Google Calendar connected!");
            navigate('/profile', { replace: true });
        } else if (params.get('google') === 'error') {
            toast.error("Failed to connect Google Calendar");
            navigate('/profile', { replace: true });
        }
    }, []);

    const handleGoogleDisconnect = async () => {
        if (!window.confirm("Are you sure you want to disconnect Google Calendar? This will stop syncing new reminders.")) return;

        try {
            await disconnectGoogle();
            toast.success("Disconnected from Google Calendar");

            // Update local state
            const updatedUser = { ...user, google_refresh_token: null };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser)); // Keep user session updated
        } catch (error) {
            toast.error("Failed to disconnect");
        }
    };

    const handleGoogleConnect = async () => {
        try {
            const response = await getGoogleAuthUrl();
            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            toast.error("Could not initiate Google connection");
        }
    };

    // Helper to format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Check if overdue
    const isOverdue = (date, completed) => {
        if (!date || completed) return false;
        return new Date(date) < new Date();
    };

    // Handle Task Update
    const handleToggleTask = async (task) => {
        try {
            const newStatus = !task.is_completed;
            await updateReminder(task.id, { is_completed: newStatus });

            // Update local state
            const updatedTask = { ...task, is_completed: newStatus };

            // Update selectedTask if open
            if (selectedTask && selectedTask.id === task.id) {
                setSelectedTask(updatedTask);
            }

            // Update reminders list
            const updatedReminders = reminders.map(r => r.id === task.id ? updatedTask : r);
            setReminders(updatedReminders);

            // Update stats items if open
            if (selectedStat.open) {
                setSelectedStat(prev => ({
                    ...prev,
                    items: prev.items.map(i => i.id === task.id ? updatedTask : i)
                }));
            }

            // Recalculate stats
            // Note: Simplification, ideally refetch or careful recalc needed if filtering calls for it.
            // For now, we'll just trigger a data refresh to be safe and consistent with filters
            fetchProfileData();

            toast.success(newStatus ? "Task completed! 🥳" : "Task reactivated");
        } catch (error) {
            toast.error("Failed to update task");
        }
    };

    // Handle Delete
    const handleDeleteTask = async (id) => {
        try {
            await deleteReminder(id);
            setReminders(prev => prev.filter(r => r.id !== id));
            if (selectedStat.open) {
                setSelectedStat(prev => ({
                    ...prev,
                    items: prev.items.filter(i => i.id !== id)
                }));
            }
            setSelectedTask(null);
            setDeleteId(null);
            fetchProfileData(); // Refresh stats
            toast.success("Task deleted");
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full w-[48px] h-[48px] border-t-2 border-b-2 border-[#f97066]"></div>
        </div>
    );

    return (
        <div className="min-h-[calc(100vh-80px)] py-[24px] sm:py-[48px] px-[16px]">
            <div className="max-w-[896px] mx-auto">
                {/* NAVIGATION ACTIONS */}
                <div className="flex items-center justify-start mb-[32px]">
                    <Link to="/" className="text-slate-500 hover:text-[#2d5bff] font-bold text-[14px] flex items-center gap-[8px] transition-colors">
                        <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Back to Dashboard</span>
                    </Link>
                </div>

                {/* MAIN PROFILE CARD */}
                <div className="glass rounded-[32px] p-[24px] sm:p-[48px] shadow-2xl overflow-hidden relative border border-white">
                    <div className="absolute top-0 right-0 w-[256px] h-[256px] bg-[#f97066]/5 rounded-full blur-[100px] -mr-[128px] -mt-[128px]"></div>

                    <div className="relative z-10">
                        {/* USER IDENTITY HEADER */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-[32px] mb-[48px]">
                            <div className="flex flex-col md:flex-row items-center gap-[24px] sm:gap-[32px]">
                                <div className="w-[96px] h-[96px] sm:w-[128px] sm:h-[128px] rounded-full bg-[#2d5bff] p-[4px] shadow-lg shadow-blue-500/10 shrink-0">
                                    {previewImage || user?.profile_image ? (
                                        <img
                                            src={previewImage || `${API_URL}${user.profile_image}`}
                                            alt="Profile"
                                            className="w-full h-full rounded-full object-cover bg-white"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[36px] sm:text-[48px] font-black text-[#2d5bff] uppercase"
                                        style={{ display: (previewImage || user?.profile_image) ? 'none' : 'flex' }}>
                                        {user?.username?.charAt(0) || 'U'}
                                    </div>
                                </div>
                                <div className="text-center md:text-left">
                                    <h1 className="text-[32px] sm:text-[40px] font-black text-slate-800 leading-tight mb-[8px]">{user?.username}</h1>
                                    <div className="flex flex-col gap-[4px]">
                                        <p className="text-slate-500 text-[14px] sm:text-[16px] font-medium flex items-center justify-center md:justify-start gap-[8px]">
                                            <span className="w-[8px] h-[8px] rounded-full bg-green-500"></span>
                                            {user?.email}
                                        </p>
                                        {user?.mobile_number && (
                                            <p className="text-slate-400 text-[12px] sm:text-[14px] font-bold tracking-wide uppercase">
                                                {user.mobile_number}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`w-full md:w-auto px-[24px] py-[12px] rounded-[16px] font-black text-[13px] tracking-widest uppercase transition-all shadow-xl active:scale-95 ${isEditing
                                    ? 'bg-slate-300 text-black hover:bg-slate-400'
                                    : 'bg-[#2d5bff] text-white hover:bg-blue-600'
                                    }`}
                            >
                                {isEditing ? 'Cancel' : 'Edit Profile'}
                            </button>
                        </div>

                        {/* EDIT FORM OR STATS */}
                        {isEditing ? (
                            <form onSubmit={handleUpdateProfile} className="bg-slate-50/50 border border-slate-100 p-[24px] sm:p-[32px] rounded-[24px] shadow-sm mb-[48px] animate-in fade-in slide-in-from-top-4 duration-300">
                                <h2 className="text-[18px] font-black mb-[24px] text-slate-800 text-center sm:text-left uppercase tracking-tighter">Update Your Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px] mb-[24px]">
                                    <div>
                                        <label className="block text-[12px] font-black text-slate-400 mb-[8px] uppercase tracking-widest">Username</label>
                                        <input
                                            type="text"
                                            value={editData.username}
                                            onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-[16px] px-[16px] py-[12px] text-slate-800 focus:outline-none focus:border-[#f97066] transition-colors font-medium"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[12px] font-black text-slate-400 mb-[8px] uppercase tracking-widest">Email Address</label>
                                        <input
                                            type="email"
                                            disabled={true}
                                            value={editData.email}
                                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-[16px] px-[16px] py-[12px] text-slate-800 focus:outline-none focus:border-[#f97066] transition-colors font-medium"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[12px] font-black text-slate-400 mb-[8px] uppercase tracking-widest">Mobile Number</label>
                                        <input
                                            type="tel"
                                            value={editData.mobile_number || ''}
                                            onChange={(e) => setEditData({ ...editData, mobile_number: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-[16px] px-[16px] py-[12px] text-slate-800 focus:outline-none focus:border-[#f97066] transition-colors font-medium"
                                            placeholder="Enter your mobile number"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[12px] font-black text-slate-400 mb-[8px] uppercase tracking-widest">Profile Picture</label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="w-full bg-white border border-slate-200 rounded-[16px] px-[16px] py-[12px] text-slate-800 focus:outline-none focus:border-[#f97066] transition-colors font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#2d5bff10] file:text-[#2d5bff] hover:file:bg-[#2d5bff20]"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="w-full bg-[#1a1c21] text-white font-black py-[14px] rounded-[16px] hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg uppercase tracking-widest text-[13px]"
                                >
                                    {updating ? 'Saving Changes...' : 'Save Changes'}
                                </button>
                            </form>
                        ) : (
                            <>
                                {/* Stats Date Picker */}
                                <div className="flex justify-end mb-4">
                                    <input
                                        type="date"
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                        className="bg-white border boundary-slate-200 text-slate-600 text-[12px] font-bold px-3 py-2 rounded-[12px] outline-none focus:border-[#2d5bff] transition-colors shadow-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px] sm:gap-[24px]">
                                    <button
                                        onClick={() => setSelectedStat({ open: true, title: 'All Tasks', items: reminders })}
                                        className="bg-white border border-slate-100 p-[16px] sm:p-[24px] rounded-[24px] text-center shadow-lg shadow-slate-200/50 hover:scale-[1.02] transition-transform active:scale-95"
                                    >
                                        <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-[4px]">Total Tasks</p>
                                        <p className="text-[32px] sm:text-[40px] font-black text-[#2d5bff]">{stats.total}</p>
                                    </button>
                                    <button
                                        onClick={() => setSelectedStat({ open: true, title: 'Completed Tasks', items: reminders.filter(r => r.is_completed) })}
                                        className="bg-emerald-50 border border-emerald-100 p-[16px] sm:p-[24px] rounded-[24px] text-center shadow-lg shadow-emerald-200/20 hover:scale-[1.02] transition-transform active:scale-95"
                                    >
                                        <p className="text-emerald-600 text-[11px] font-black uppercase tracking-widest mb-[4px]">Completed</p>
                                        <p className="text-[32px] sm:text-[40px] font-black text-emerald-600">{stats.completed}</p>
                                    </button>
                                    <button
                                        onClick={() => setSelectedStat({ open: true, title: 'Remaining Tasks', items: reminders.filter(r => !r.is_completed) })}
                                        className="bg-amber-50 border border-amber-100 p-[16px] sm:p-[24px] rounded-[24px] text-center shadow-lg shadow-amber-200/20 hover:scale-[1.02] transition-transform active:scale-95"
                                    >
                                        <p className="text-amber-600 text-[11px] font-black uppercase tracking-widest mb-[4px]">Remaining</p>
                                        <p className="text-[32px] sm:text-[40px] font-black text-amber-600">{stats.pending}</p>
                                    </button>
                                </div>

                                <div className="mt-[48px] pt-[32px] border-t border-slate-100/50">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-[24px] bg-slate-50/50 border border-slate-100 p-[24px] sm:p-[32px] rounded-[32px]">
                                        <div className="flex items-center gap-[20px] text-center sm:text-left">
                                            <div className="w-[56px] h-[56px] rounded-[20px] bg-white shadow-xl flex items-center justify-center text-[#4285F4]">
                                                <FaGoogle className="text-[24px]" />
                                            </div>
                                            <div>
                                                <h3 className="text-[17px] font-black text-slate-800 tracking-tight">Google Calendar</h3>
                                                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-[2px]">
                                                    {user?.google_refresh_token ? 'Connected & Sycing' : 'Not Connected'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={user?.google_refresh_token ? handleGoogleDisconnect : handleGoogleConnect}
                                            className={`flex items-center gap-[12px] px-[24px] py-[14px] rounded-[18px] font-black text-[13px] tracking-widest uppercase transition-all shadow-lg active:scale-95 ${user?.google_refresh_token
                                                ? 'bg-rose-500 text-white hover:bg-rose-600'
                                                : 'bg-[#4285F4] text-white hover:bg-blue-600'
                                                }`}
                                        >
                                            <FaCalendarAlt className="text-[16px]" />
                                            {user?.google_refresh_token ? 'Disconnect' : 'Connect Calendar'}
                                        </button>
                                    </div>
                                    <p className="text-center mt-[16px] text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                                        Link your calendar to get automatic notifications & event sync
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* SETTINGS SECTION */}
                {!isEditing && (
                    <div className="mt-[32px] glass rounded-[32px] p-[24px] sm:p-[32px] border border-white shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-[12px] mb-[24px]">
                            <div className="w-[40px] h-[40px] bg-slate-100 rounded-[12px] flex items-center justify-center">
                                <svg className="w-[20px] h-[20px] text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h2 className="text-[18px] font-black text-slate-800 uppercase tracking-tighter">Account Settings</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                            <div className="p-[20px] rounded-[24px] bg-red-50/50 border border-red-100 flex items-center justify-between group">
                                <div>
                                    <h3 className="font-black text-slate-800 text-[14px]">Session</h3>
                                    <p className="text-[12px] text-slate-500 font-medium">Log out of your current session</p>
                                </div>
                                <button
                                    onClick={logout}
                                    className="bg-white hover:bg-red-500 hover:text-white text-red-500 px-[20px] py-[10px] rounded-[14px] text-[11px] font-black tracking-widest uppercase border border-red-100 transition-all shadow-sm active:scale-95"
                                >
                                    Logout
                                </button>
                            </div>

                            <div className="p-[20px] rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-between opacity-60">
                                <div>
                                    <h3 className="font-black text-slate-800 text-[14px]">Privacy</h3>
                                    <p className="text-[12px] text-slate-500 font-medium">Manage your data</p>
                                </div>
                                <span className="bg-slate-200 text-slate-500 px-[12px] py-[6px] rounded-full text-[9px] font-black uppercase tracking-widest">Coming Soon</span>
                            </div>
                        </div>
                    </div>
                )}
                {/* STATS MODAL - Dynamic Theme */}
                {selectedStat.open && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div
                            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header - Dynamic Theme */}
                            <div className={`relative p-4 sm:p-6 md:p-8 shrink-0 overflow-hidden ${selectedStat.title === 'Completed Tasks' ? 'bg-linear-to-r from-emerald-500 via-teal-500 to-green-500' :
                                    selectedStat.title === 'Remaining Tasks' ? 'bg-linear-to-r from-amber-500 via-orange-500 to-red-500' :
                                        'bg-linear-to-r from-[#2d5bff] via-[#4a69ff] to-[#6366f1]'
                                }`}>
                                {/* Decorative circle */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>

                                <div className="flex justify-between items-center relative z-10">
                                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight shadow-sm">
                                        {selectedStat.title}
                                    </h3>
                                    <button
                                        onClick={() => setSelectedStat({ ...selectedStat, open: false })}
                                        className="p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all text-white backdrop-blur-sm"
                                    >
                                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                </div>
                                <p className="text-white/80 text-xs sm:text-sm font-bold uppercase tracking-widest mt-1">
                                    {selectedStat.items.length} Tasks found
                                </p>
                            </div>

                            {/* Modal Body - Scrollable List */}
                            <div className="overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar bg-slate-50/50">
                                {selectedStat.items.length > 0 ? (
                                    <div className="space-y-3 sm:space-y-4">
                                        {selectedStat.items.map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedTask(item)}
                                                className={`group relative p-4 rounded-xl border border-white shadow-sm hover:shadow-md transition-all cursor-pointer bg-white overflow-hidden active:scale-[0.99] ${item.is_completed ? 'opacity-75 grayscale-[0.5]' : ''}`}
                                            >
                                                {/* Left Border accent */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 ${item.priority === 'high' ? 'bg-[#ff4d4d]' :
                                                        item.priority === 'medium' ? 'bg-[#ffb800]' :
                                                            'bg-[#2d5bff]'
                                                    }`}></div>

                                                <div className="pl-3 sm:pl-4 flex justify-between items-start gap-3">
                                                    <div>
                                                        <h4 className={`font-black text-sm sm:text-base text-slate-800 mb-1 ${item.is_completed ? 'line-through text-slate-400' : ''}`}>
                                                            {item.title}
                                                        </h4>
                                                        {item.description && (
                                                            <p className="text-[11px] sm:text-xs text-slate-500 font-medium line-clamp-1 mb-2">
                                                                {item.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            {item.due_date && (
                                                                <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${isOverdue(item.due_date, item.is_completed) ? 'text-red-500' : 'text-slate-400'}`}>
                                                                    <Clock className="w-3 h-3" />
                                                                    {formatDate(item.due_date)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <span className={`shrink-0 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${item.priority === 'high' ? 'bg-red-50 text-red-500 border-red-100' :
                                                            item.priority === 'medium' ? 'bg-amber-50 text-amber-500 border-amber-100' :
                                                                'bg-blue-50 text-blue-500 border-blue-100'
                                                        }`}>
                                                        {item.priority}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                                        <div className="w-16 h-16 bg-slate-200/50 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                            <Calendar className="w-8 h-8" />
                                        </div>
                                        <p className="text-slate-500 font-black text-sm uppercase tracking-widest">No tasks here</p>
                                        <p className="text-slate-400 text-[11px] font-bold mt-1">Enjoy your free time!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/* Detail Modal for Selected Task */}
                {selectedTask && (
                    <div
                        className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setSelectedTask(null)}
                    >
                        <div
                            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 custom-scrollbar border border-white"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header - Blue Theme */}
                            <div className="relative p-4 sm:p-6 md:p-8 rounded-t-xl sm:rounded-t-2xl bg-linear-to-r from-[#2d5bff] via-[#4a69ff] to-[#6366f1] overflow-hidden">
                                {/* Decorative circle */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>

                                <button
                                    onClick={() => setSelectedTask(null)}
                                    className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all text-white backdrop-blur-sm"
                                >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>

                                <div className="flex items-start gap-3 sm:gap-4 pr-8 sm:pr-10 relative z-10">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                                            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-sm ${selectedTask.priority === 'high'
                                                ? 'bg-red-100 text-red-700'
                                                : selectedTask.priority === 'medium'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-white text-[#2d5bff]'
                                                }`}>
                                                {selectedTask.priority} Priority
                                            </span>
                                            {!!selectedTask.is_completed && (
                                                <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-400 text-white shadow-sm">
                                                    Completed
                                                </span>
                                            )}
                                        </div>
                                        <h2 className={`text-xl sm:text-2xl md:text-3xl font-black text-white mb-1 tracking-tight ${selectedTask.is_completed ? 'line-through opacity-80' : ''}`}>
                                            {selectedTask.title}
                                        </h2>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                                {/* Description */}
                                {selectedTask.description && (
                                    <div>
                                        <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                            Description
                                        </h3>
                                        <p className="text-sm sm:text-base md:text-lg text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                                            {selectedTask.description}
                                        </p>
                                    </div>
                                )}

                                {/* Due Date */}
                                {selectedTask.due_date && (
                                    <div>
                                        <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                            Due Date
                                        </h3>
                                        <div className={`flex flex-wrap items-center gap-2 text-sm sm:text-base md:text-lg font-bold ${isOverdue(selectedTask.due_date, selectedTask.is_completed)
                                            ? 'text-red-500'
                                            : 'text-slate-700'
                                            }`}>
                                            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span>{formatDate(selectedTask.due_date)}</span>
                                            {isOverdue(selectedTask.due_date, selectedTask.is_completed) && (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] sm:text-xs font-black rounded-full uppercase tracking-wider">
                                                    Overdue
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => handleToggleTask(selectedTask)}
                                        className={`flex-1 py-3 px-6 rounded-xl font-black text-[13px] tracking-widest uppercase transition-all shadow-lg active:scale-95 ${selectedTask.is_completed
                                            ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                            : 'bg-[#2d5bff] text-white hover:bg-blue-600 shadow-blue-500/30'
                                            }`}
                                    >
                                        {selectedTask.is_completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                                    </button>

                                    {!!selectedTask.is_completed && (
                                        <button
                                            onClick={() => {
                                                setDeleteId(selectedTask.id);
                                                // Don't close selectedTask yet, let delete confirmation render on top or replace
                                            }}
                                            className="flex-1 sm:flex-none py-3 px-6 rounded-xl font-black text-[13px] tracking-widest uppercase bg-white border-2 border-red-50 text-[#ff4d4d] hover:bg-red-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal (Reused) */}
                {deleteId && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                        <div className="bg-white rounded-[32px] p-6 sm:p-8 w-full max-w-[400px] shadow-2xl animate-in zoom-in-95 duration-200 border border-white">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100 shadow-lg shadow-red-500/10">
                                    <Trash2 className="w-8 h-8 text-[#ff4d4d] animate-bounce" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Are you sure?</h3>
                                <p className="text-slate-500 text-sm font-medium mb-8">
                                    This action cannot be undone. This reminder will be permanently deleted.
                                </p>
                                <div className="flex w-full gap-3">
                                    <button
                                        onClick={() => setDeleteId(null)}
                                        className="flex-1 py-3 px-6 rounded-xl font-black text-[11px] tracking-widest uppercase border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTask(deleteId)}
                                        className="flex-1 py-3 px-6 rounded-xl font-black text-[11px] tracking-widest uppercase bg-[#ff4d4d] text-white shadow-lg shadow-red-500/20 hover:bg-[#ff3333] hover:shadow-xl transition-all active:scale-95"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
