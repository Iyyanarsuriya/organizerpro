import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Bell, X, ChevronRight, Home, LogOut, Users, User as UserIcon } from 'lucide-react';
import { API_URL } from '../../api/axiosInstance';

const Navbar = ({
    user,
    token,
    todayReminders,
    onLoginClick,
    onSignupClick,
    onProfileClick,
    onLogout
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const closeTimeout = useRef(null);
    const dropdownRef = useRef(null);
    const [imageError, setImageError] = useState(false);
    const isLandingPage = location.pathname === '/';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };

        if (showProfileDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfileDropdown]);

    return (
        <header className={`fixed top-0 left-0 right-0 z-100 backdrop-blur-xl border-b transition-all duration-300 ${isLandingPage ? 'bg-white/80 border-slate-200' : 'bg-black border-white/10'}`}>
            <div className="max-w-[1440px] mx-auto px-[20px] sm:px-[40px] h-[72px] sm:h-[80px] flex items-center justify-between">

                {/* Left: Branding */}
                <div className="flex items-center gap-[8px] sm:gap-[12px] group cursor-pointer" onClick={() => navigate('/')}>
                    <div className={`w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] rounded-[10px] sm:rounded-[12px] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${isLandingPage ? 'bg-slate-900 shadow-slate-200/50' : 'bg-linear-to-br from-[#2d5bff] to-[#6366f1] shadow-blue-500/20'}`}>
                        <LayoutDashboard className="text-white w-[20px] h-[20px] sm:w-[24px] sm:h-[24px]" />
                    </div>
                    <span className={`text-[18px] sm:text-[22px] font-black tracking-tighter ${isLandingPage ? 'text-slate-900' : 'text-white'}`}>Organizer<span className={isLandingPage ? 'text-black' : 'text-blue-500'}>Pro</span></span>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-[12px] sm:gap-[24px]">
                    {!token ? (
                        <>
                            <button
                                onClick={onLoginClick}
                                className={`text-[14px] font-black transition-all cursor-pointer ${isLandingPage ? 'text-slate-600 hover:text-black' : 'text-white hover:text-blue-400'}`}
                            >
                                Log In
                            </button>
                            <button
                                onClick={onSignupClick}
                                className={`hidden sm:flex items-center text-white text-[13px] font-black px-[24px] py-[10px] rounded-full transition-all active:scale-95 shadow-lg cursor-pointer text-center ${isLandingPage ? 'bg-black hover:bg-slate-800 shadow-slate-200' : 'bg-[#00d1a0] hover:bg-[#00b890] shadow-emerald-500/20'}`}
                            >
                                Get Started Free
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-4 sm:gap-[24px]">
                            {!isLandingPage && (
                                <button
                                    onClick={() => navigate('/')}
                                    className="w-[34px] h-[34px] sm:w-[40px] sm:h-[40px] bg-white/10 hover:bg-white text-white hover:text-black rounded-[10px] sm:rounded-[12px] flex items-center justify-center transition-all duration-300 active:scale-90 shadow-lg shadow-white/5 group"
                                    title="Back to Home"
                                >
                                    <Home className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110" />
                                </button>
                            )}

                            {/* Profile Icon (Before Bell) */}
                            {/* Profile Dropdown */}
                            <div
                                className="relative"
                                ref={dropdownRef}
                                onMouseEnter={() => {
                                    if (closeTimeout.current) clearTimeout(closeTimeout.current);
                                    setShowProfileDropdown(true);
                                }}
                                onMouseLeave={() => {
                                    closeTimeout.current = setTimeout(() => {
                                        setShowProfileDropdown(false);
                                    }, 1000);
                                }}
                            >
                                <button
                                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                    className="w-[34px] h-[34px] sm:w-[40px] sm:h-[40px] rounded-full bg-linear-to-br from-[#2d5bff] to-[#6366f1] border-2 border-white/10 overflow-hidden hover:border-white transition-all active:scale-90 cursor-pointer shadow-lg shadow-blue-500/20 flex items-center justify-center group shrink-0"
                                >
                                    <span className="text-white font-black text-[14px] sm:text-[15px] tracking-tight">
                                        {user?.username ? user.username.charAt(0).toUpperCase() : '?'}
                                    </span>
                                </button>

                                {showProfileDropdown && (
                                    <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                                        <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                                            <p className="text-sm font-bold text-slate-800 truncate">{user?.username}</p>
                                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                        </div>
                                        <div className="p-2">
                                            <button
                                                onClick={() => {
                                                    onProfileClick();
                                                    setShowProfileDropdown(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                            >
                                                <UserIcon className="w-4 h-4" />
                                                My Profile
                                            </button>

                                            {user?.role === 'admin' && (
                                                <button
                                                    onClick={() => {
                                                        navigate('/team');
                                                        setShowProfileDropdown(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                                >
                                                    <Users className="w-4 h-4" />
                                                    Team Management
                                                </button>
                                            )}

                                            <div className="h-px bg-slate-100 my-1"></div>

                                            <button
                                                onClick={() => {
                                                    onLogout();
                                                    setShowProfileDropdown(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Log Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Notification Bell */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                                    className={`relative p-2 rounded-[12px] transition-all active:scale-90 cursor-pointer ${showNotifDropdown
                                        ? (isLandingPage ? 'bg-slate-100 text-black' : 'bg-white/10 text-white')
                                        : (isLandingPage ? 'text-slate-500 hover:text-black hover:bg-slate-50' : 'text-white hover:bg-white/5')
                                        }`}
                                >
                                    <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                                    {todayReminders.length > 0 && (
                                        <span className={`absolute top-[6px] right-[6px] w-[14px] h-[14px] sm:w-[18px] sm:h-[18px] bg-[#ff4d4d] border-2 rounded-full text-[8px] sm:text-[10px] font-black text-white flex items-center justify-center animate-pulse ${isLandingPage ? 'border-white' : 'border-black'}`}>
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
                        </div>
                    )}

                    {/* Theme/Clock Icons Removed */}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
