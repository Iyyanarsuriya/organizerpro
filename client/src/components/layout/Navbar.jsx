import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, Bell, X, ChevronRight, Sun, Clock } from 'lucide-react';
import { API_URL } from '../../api/axiosInstance';

const Navbar = ({
    user,
    token,
    todayReminders,
    onLoginClick,
    onSignupClick,
    onProfileClick
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [imageError, setImageError] = useState(false);
    const isLandingPage = location.pathname === '/';

    return (
        <header className="fixed top-0 left-0 right-0 z-100 bg-[#1a1c21]/80 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-[1440px] mx-auto px-[16px] sm:px-[40px] h-[72px] sm:h-[80px] flex items-center justify-between">

                {/* Left: Branding */}
                <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] bg-linear-to-br from-[#2d5bff] to-[#6366f1] rounded-[10px] sm:rounded-[12px] flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                        <LayoutDashboard className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-white text-[18px] sm:text-[22px] font-black tracking-tighter">Organizer<span className="text-blue-500">Pro</span></span>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 sm:gap-6">
                    {!token ? (
                        <>
                            <button
                                onClick={onLoginClick}
                                className="text-[14px] font-black text-white hover:text-blue-400 transition-all cursor-pointer"
                            >
                                Log In
                            </button>
                            <button
                                onClick={onSignupClick}
                                className="hidden sm:flex items-center bg-[#00d1a0] hover:bg-[#00b890] text-white text-[13px] font-black px-[24px] py-[10px] rounded-full transition-all active:scale-95 shadow-lg shadow-emerald-500/20 cursor-pointer text-center"
                            >
                                Get Started Free
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-4 sm:gap-[24px]">
                            {!isLandingPage && (
                                <Link to="/" className="text-[10px] sm:text-[12px] font-black tracking-widest uppercase text-white/70 hover:text-white transition-all duration-300 hidden xs:block">
                                    Home
                                </Link>
                            )}

                            {/* Notification Bell */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                                    className={`relative p-2 rounded-full transition-all active:scale-90 cursor-pointer ${showNotifDropdown ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                                    {todayReminders.length > 0 && (
                                        <span className="absolute top-[6px] right-[6px] w-[14px] h-[14px] sm:w-[18px] sm:h-[18px] bg-[#ff4d4d] border-2 border-[#1a1c21] rounded-full text-[8px] sm:text-[10px] font-black text-white flex items-center justify-center animate-pulse">
                                            {todayReminders.length}
                                        </span>
                                    )}
                                </button>

                                {/* Notification Dropdown */}
                                {showNotifDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)}></div>
                                        <div className="absolute right-0 mt-[16px] w-[280px] sm:w-[320px] bg-white rounded-[24px] shadow-2xl z-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
                                            <div className="p-[20px] border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                                <h3 className="font-black text-[12px] sm:text-[14px] text-slate-800 uppercase tracking-widest">Today's Tasks</h3>
                                                <button onClick={() => setShowNotifDropdown(false)} className="text-slate-400 hover:text-red-500 cursor-pointer p-1">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                                                {todayReminders.length > 0 ? (
                                                    todayReminders.map(notif => (
                                                        <button
                                                            key={notif.id}
                                                            onClick={() => {
                                                                setShowNotifDropdown(false);
                                                                navigate('/reminders');
                                                            }}
                                                            className="w-full text-left p-[16px] border-b border-slate-50 hover:bg-blue-50/50 transition-colors group cursor-pointer"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0 group-hover:scale-125 transition-transform"></div>
                                                                <div className="flex-1">
                                                                    <p className="text-[13px] sm:text-[14px] font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">{notif.title}</p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Due Today</span>
                                                                        <ChevronRight className="w-3 h-3 text-slate-300 group-hover:translate-x-1 transition-transform" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-10 text-center">
                                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                            <Bell className="w-6 h-6 text-slate-300" />
                                                        </div>
                                                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">All caught up!</p>
                                                    </div>
                                                )}
                                            </div>
                                            {todayReminders.length > 0 && (
                                                <button
                                                    onClick={() => {
                                                        setShowNotifDropdown(false);
                                                        navigate('/reminders');
                                                    }}
                                                    className="w-full py-4 text-center text-[11px] font-black text-blue-500 uppercase tracking-widest hover:bg-blue-50 transition-colors"
                                                >
                                                    View All Reminders
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Profile Icon (Last) */}
                            <button
                                onClick={onProfileClick}
                                className="w-[36px] h-[36px] sm:w-[42px] sm:h-[42px] rounded-full bg-linear-to-br from-[#2d5bff] to-[#6366f1] border-2 border-white/20 overflow-hidden hover:border-white transition-all active:scale-90 cursor-pointer shadow-lg shadow-blue-500/20 flex items-center justify-center group"
                            >
                                {(user?.profile_image && !imageError) ? (
                                    <img
                                        src={user.profile_image.startsWith('http') ? user.profile_image : `${API_URL}${user.profile_image}`}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <span className="text-white font-black text-[15px] sm:text-[16px] tracking-tight">
                                        {user?.username ? user.username.charAt(0).toUpperCase() : '?'}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Theme/Clock Icons Removed */}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
