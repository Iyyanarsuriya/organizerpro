import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserProfile } from '../api/userApi';
import { getReminders } from '../api/homeApi';
import { updateProfile } from '../api/authApi';
import toast from 'react-hot-toast';

const Profile = () => {
    const [user, setUser] = useState({ username: '', email: '', mobile_number: '' });
    const [reminders, setReminders] = useState([]);
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
    const [selectedStat, setSelectedStat] = useState({ open: false, title: '', items: [] });
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ username: '', email: '', mobile_number: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [updating, setUpdating] = useState(false);
    const navigate = useNavigate();

    const fetchProfileData = async () => {
        try {
            const [userRes, remindersRes] = await Promise.all([
                getUserProfile(),
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

            // Update local user state with new data including image if returned
            setUser(prev => ({
                ...prev,
                ...editData,
                profile_image: response.data.profile_image || prev.profile_image
            }));

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
        window.dispatchEvent(new Event('storage'));
        toast.success("Logged out successfully");
        navigate('/login');
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full w-[48px] h-[48px] border-t-2 border-b-2 border-[#f97066]"></div>
        </div>
    );

    return (
        <div className="min-h-[calc(100vh-80px)] py-[24px] sm:py-[48px] px-[16px]">
            <div className="max-w-[896px] mx-auto">
                {/* NAVIGATION ACTIONS */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-[16px] mb-[32px]">
                    <Link to="/" className="text-slate-500 hover:text-[#f97066] font-bold text-[14px] flex items-center gap-[8px] transition-colors order-2 sm:order-1">
                        <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Back to Dashboard</span>
                    </Link>
                    <button
                        onClick={logout}
                        className="w-full sm:w-auto bg-white hover:bg-red-50 text-red-500 px-[24px] py-[10px] rounded-[16px] text-[13px] font-black tracking-widest uppercase border border-red-100 transition-all order-1 sm:order-2 shadow-sm"
                    >
                        Logout Account
                    </button>
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
                                            src={previewImage || `http://192.168.0.169:5000${user.profile_image}`}
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
                        )}
                    </div>
                </div>
                {/* STATS MODAL */}
                {selectedStat.open && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-[16px]">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedStat({ ...selectedStat, open: false })}></div>
                        <div className="relative bg-white rounded-[32px] p-[24px] sm:p-[32px] w-full max-w-[600px] max-h-[80vh] overflow-hidden shadow-2xl flex flex-col border border-white">
                            <div className="flex justify-between items-center mb-[24px] flex-shrink-0">
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
                                            <div key={item.id} className={`p-[16px] rounded-[20px] border transition-colors shadow-sm ${selectedStat.title === 'Remaining Tasks' ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-orange-100' :
                                                selectedStat.title === 'Completed Tasks' ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100' :
                                                    'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'
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
