import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReminders } from '../api/homeApi';
import { disconnectGoogle, getGoogleAuthUrl, getMe } from '../api/authApi';
import { API_URL } from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { FaGoogle } from 'react-icons/fa';
import { Settings, LogOut, Calendar, LayoutDashboard } from 'lucide-react';

const Profile = () => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : { username: '', email: '' };
    });
    const [reminders, setReminders] = useState([]);
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const navigate = useNavigate();

    const fetchProfileData = async () => {
        try {
            const [userRes, remindersRes] = await Promise.all([
                getMe(),
                getReminders()
            ]);

            setUser(userRes.data);
            localStorage.setItem('user', JSON.stringify(userRes.data));
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

    useEffect(() => {
        fetchProfileData();
    }, [filterDate]);

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

    const handleGoogleDisconnect = async () => {
        if (!window.confirm("Disconnect Google Calendar?")) return;
        try {
            await disconnectGoogle();
            toast.success("Disconnected from Google Calendar");
            fetchProfileData();
        } catch (error) {
            toast.error("Failed to disconnect");
        }
    };

    const logout = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.dispatchEvent(new Event('storage'));
        toast.success("Logged out successfully");
        navigate('/');
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
            <div className="animate-spin rounded-full w-[48px] h-[48px] border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] p-[16px] sm:p-[32px] md:p-[48px]">
            <div className="max-w-[1024px] mx-auto">

                {/* Header Row with Date Picker */}
                <div className="flex justify-end mb-[32px]">
                    <div className="relative group">
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-[16px] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm cursor-pointer appearance-none"
                        />
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Stat Cards Container */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px] mb-[48px]">
                    {/* Total Tasks */}
                    <div className="bg-white rounded-[40px] p-[32px] shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-md transition-all">
                        <span className="text-slate-400 text-[12px] font-black uppercase tracking-widest mb-2 group-hover:text-blue-500 transition-colors">Total Tasks</span>
                        <h2 className="text-[64px] font-black text-[#2d5bff] leading-none">{stats.total}</h2>
                    </div>

                    {/* Completed */}
                    <div className="bg-white rounded-[40px] p-[32px] shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-md transition-all">
                        <span className="text-[#00d1a0] text-[12px] font-black uppercase tracking-widest mb-2">Completed</span>
                        <h2 className="text-[64px] font-black text-[#00d1a0] leading-none">{stats.completed}</h2>
                    </div>

                    {/* Remaining */}
                    <div className="bg-white rounded-[40px] p-[32px] shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-md transition-all">
                        <span className="text-amber-500 text-[12px] font-black uppercase tracking-widest mb-2">Remaining</span>
                        <h2 className="text-[64px] font-black text-amber-500 leading-none">{stats.pending}</h2>
                    </div>
                </div>

                {/* Google Calendar Section */}
                <div className="bg-white rounded-[40px] p-[24px] sm:p-[32px] shadow-sm border border-white mb-[32px] flex flex-col sm:flex-row items-center justify-between gap-[24px]">
                    <div className="flex items-center gap-[20px]">
                        <div className="w-[64px] h-[64px] rounded-full bg-white shadow-xl flex items-center justify-center border border-slate-50">
                            <FaGoogle className="text-[28px] text-[#4285F4]" />
                        </div>
                        <div className="text-center sm:text-left">
                            <h3 className="text-[20px] font-black text-slate-800 tracking-tight">Google Calendar</h3>
                            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                {user?.google_refresh_token ? 'Connected' : 'Not Connected'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={user?.google_refresh_token ? handleGoogleDisconnect : handleGoogleConnect}
                        className="w-full sm:w-auto flex items-center justify-center gap-[12px] bg-[#2d5bff] hover:bg-blue-600 text-white px-[32px] py-[16px] rounded-[24px] font-black text-[14px] tracking-widest uppercase transition-all shadow-lg active:scale-95 cursor-pointer"
                    >
                        <Calendar className="w-5 h-5" />
                        {user?.google_refresh_token ? 'Disconnect' : 'Connect Calendar'}
                    </button>
                </div>
                <p className="text-center text-[12px] text-slate-400 font-bold uppercase tracking-widest mb-[64px]">
                    Link your calendar to get automatic notifications & event sync
                </p>

                {/* Account Settings Section */}
                <div className="mb-[24px]">
                    <div className="flex items-center gap-[12px] mb-[24px]">
                        <div className="w-[40px] h-[40px] bg-slate-100 rounded-[12px] flex items-center justify-center">
                            <Settings className="w-5 h-5 text-slate-500" />
                        </div>
                        <h2 className="text-[18px] font-black text-slate-800 uppercase tracking-tighter">Account Settings</h2>
                    </div>

                    <div className="bg-white rounded-[40px] border border-[#ff4d4d20] p-[24px] sm:p-[32px] flex flex-col sm:flex-row items-center justify-between gap-[20px] shadow-sm hover:border-[#ff4d4d40] transition-all">
                        <div className="text-center sm:text-left">
                            <h3 className="font-black text-slate-800 text-[16px]">Session</h3>
                            <p className="text-[14px] text-slate-500 font-medium">Log out of your current session</p>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full sm:w-auto px-[32px] py-[14px] rounded-[18px] font-black text-[12px] tracking-widest uppercase bg-white border border-slate-200 text-[#ff4d4d] hover:bg-red-50 hover:border-red-100 transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                            Logout
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Profile;
