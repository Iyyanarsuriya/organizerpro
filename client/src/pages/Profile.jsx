import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getReminders } from '../api/homeApi';
import { disconnectGoogle, updateProfile, getGoogleAuthUrl, getMe } from '../api/authApi';
import { API_URL } from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { FaGoogle, FaCalendarAlt } from 'react-icons/fa';

const Profile = () => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : { username: '', email: '', mobile_number: '' };
    });
    const [reminders, setReminders] = useState([]);
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
    const [selectedStat, setSelectedStat] = useState({ open: false, title: '', items: [] });
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

            const completed = fetchedReminders.filter(r => r.is_completed).length;
            setStats({
                total: fetchedReminders.length,
                completed: completed,
                pending: fetchedReminders.length - completed
            });
        } catch (error) {
            console.error("Error fetching profile", error);
        } finally {
            setLoading(false);
        }
    };

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
            toast.dismiss();
            // Update local user state with new data including image if returned
            const updatedUser = {
                ...user,
                ...editData,
                profile_image: response.data.profile_image || user.profile_image
            };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setIsEditing(false);
            setSelectedFile(null);
            setPreviewImage(null);
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.dismiss();
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
        toast.dismiss();
        toast.success("Logged out successfully");
        navigate('/login');
    };

    useEffect(() => {
        fetchProfileData();

        // Check for google auth status in URL
        const params = new URLSearchParams(window.location.search);
        if (params.get('google') === 'success') {
            toast.dismiss();
            toast.success("Google Calendar connected!");
            navigate('/profile', { replace: true });
        } else if (params.get('google') === 'error') {
            toast.dismiss();
            toast.error("Failed to connect Google Calendar");
            navigate('/profile', { replace: true });
        }
    }, []);

    const handleGoogleDisconnect = async () => {
        if (!window.confirm("Are you sure you want to disconnect Google Calendar? This will stop syncing new reminders.")) return;

        try {
            await disconnectGoogle();
            toast.dismiss();
            toast.success("Disconnected from Google Calendar");

            // Update local state
            const updatedUser = { ...user, google_refresh_token: null };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser)); // Keep user session updated
        } catch (error) {
            toast.dismiss();
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
            toast.dismiss();
            toast.error("Could not initiate Google connection");
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
                                                : 'bg-white text-slate-800 hover:bg-[#4285F4] hover:text-white border border-slate-100'
                                                }`}
                                        >
                                            <FaCalendarAlt className="text-[16px]" />
                                            {user?.google_refresh_token ? 'Disconnect' : 'Connect Now'}
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
                {/* STATS MODAL */}
                {selectedStat.open && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-[16px]">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedStat({ ...selectedStat, open: false })}></div>
                        <div className="relative bg-white rounded-[32px] p-[24px] sm:p-[32px] w-full max-w-[600px] max-h-[80vh] overflow-hidden shadow-2xl flex flex-col border border-white">
                            <div className="flex justify-between items-center mb-[24px] shrink-0">
                                <h3 className={`text-[20px] font-black uppercase tracking-tighter ${selectedStat.title === 'Remaining Tasks' ? 'text-amber-500' :
                                    selectedStat.title === 'Completed Tasks' ? 'text-emerald-500' :
                                        'text-[#2d5bff]'
                                    }`}>{selectedStat.title}</h3>
                                <button onClick={() => setSelectedStat({ ...selectedStat, open: false })} className="text-slate-400 hover:text-[#ff4d4d] p-1 rounded-full hover:bg-slate-100 transition-all">
                                    <svg className="w-[24px] h-[24px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="overflow-y-auto flex-1 pr-[8px] custom-scrollbar">
                                {selectedStat.items.length > 0 ? (
                                    <div className="space-y-[12px]">
                                        {selectedStat.items.map(item => (
                                            <div key={item.id} className={`p-[16px] rounded-[20px] border transition-colors shadow-sm ${selectedStat.title === 'Remaining Tasks' ? 'bg-linear-to-br from-amber-50 to-orange-50 border-orange-100' :
                                                selectedStat.title === 'Completed Tasks' ? 'bg-linear-to-br from-emerald-50 to-teal-50 border-emerald-100' :
                                                    'bg-linear-to-br from-blue-50 to-indigo-50 border-blue-100'
                                                }`}>
                                                <div className="flex justify-between items-start mb-[4px]">
                                                    <h4 className={`font-bold text-slate-800 ${item.is_completed ? 'line-through text-slate-400' : ''}`}>{item.title}</h4>
                                                    <span className={`text-[10px] font-black uppercase px-[8px] py-[2px] rounded-full border ${item.priority === 'high' ? 'bg-white/50 text-[#ff4d4d] border-red-100' :
                                                        item.priority === 'medium' ? 'bg-white/50 text-[#ffb800] border-amber-100' :
                                                            'bg-white/50 text-slate-500 border-slate-200'
                                                        }`}>
                                                        {item.priority}
                                                    </span>
                                                </div>
                                                {item.description && <p className="text-[12px] text-slate-500 mb-[8px]">{item.description}</p>}
                                                <div className="text-[10px] text-slate-400 font-bold">
                                                    {item.due_date ? new Date(item.due_date).toLocaleString() : 'No due date'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-[48px] text-center text-slate-400">
                                        No tasks found in this category.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
