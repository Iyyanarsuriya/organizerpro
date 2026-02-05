import { Link } from 'react-router-dom';
import {
    Bell,
    CalendarCheck,
    Users,
    Wallet,
    Home,
    Calendar,
    UserCircle,
    Settings,
    FileText,
    ClipboardList
} from 'lucide-react';

const HotelHome = () => {
    const modules = [
        { title: 'Bookings', icon: Calendar, link: '/hotel-sector/bookings', color: 'bg-indigo-600', shadow: 'shadow-indigo-500/30', bg: 'bg-indigo-50/50', hoverBg: 'hover:bg-indigo-50', border: 'border-indigo-100/50', textColor: 'text-indigo-600' },
        { title: 'Units / Rooms', icon: Home, link: '/hotel-sector/units', color: 'bg-blue-600', shadow: 'shadow-blue-500/30', bg: 'bg-blue-50/50', hoverBg: 'hover:bg-blue-50', border: 'border-blue-100/50', textColor: 'text-blue-600' },
        { title: 'Guests', icon: UserCircle, link: '/hotel-sector/guests', color: 'bg-emerald-600', shadow: 'shadow-emerald-500/30', bg: 'bg-emerald-50/50', hoverBg: 'hover:bg-emerald-50', border: 'border-emerald-100/50', textColor: 'text-emerald-600' },
        { title: 'Operations', icon: ClipboardList, link: '/hotel-sector/ops', color: 'bg-orange-600', shadow: 'shadow-orange-500/30', bg: 'bg-orange-50/50', hoverBg: 'hover:bg-orange-50', border: 'border-orange-100/50', textColor: 'text-orange-600' },
        { title: 'Expenses', icon: Wallet, link: '/hotel-sector/expenses', color: 'bg-rose-600', shadow: 'shadow-rose-500/30', bg: 'bg-rose-50/50', hoverBg: 'hover:bg-rose-50', border: 'border-rose-100/50', textColor: 'text-rose-600' },
        { title: 'Attendance', icon: CalendarCheck, link: '/hotel-sector/attendance', color: 'bg-sky-600', shadow: 'shadow-sky-500/30', bg: 'bg-sky-50/50', hoverBg: 'hover:bg-sky-50', border: 'border-sky-100/50', textColor: 'text-sky-600' },
        { title: 'Team', icon: Users, link: '/hotel-sector/team', color: 'bg-purple-600', shadow: 'shadow-purple-500/30', bg: 'bg-purple-50/50', hoverBg: 'hover:bg-purple-50', border: 'border-purple-100/50', textColor: 'text-purple-600' },
        { title: 'Reminders', icon: Bell, link: '/hotel-sector/reminders', color: 'bg-amber-600', shadow: 'shadow-amber-500/30', bg: 'bg-amber-50/50', hoverBg: 'hover:bg-amber-50', border: 'border-amber-100/50', textColor: 'text-amber-600' },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-[20px] sm:p-[40px] font-['Outfit']">
            <div className="max-w-[1280px] mx-auto w-full">
                {/* Header Section */}
                <div className="text-center mb-[40px] sm:mb-[64px]">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 mb-6">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">OrganizerPro Hospitality ERP</span>
                    </div>
                    <h1 className="text-[32px] sm:text-[48px] font-black text-slate-800 tracking-tight mb-[16px]">
                        Property <span className="text-blue-600">Dashboard</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-[14px] sm:text-[16px]">One core system for Hotels & Homestays</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[16px] sm:gap-[24px] justify-center max-w-[1200px] mx-auto">
                    {modules.map((m, i) => (
                        <Link key={i} to={m.link} className={`group flex flex-col items-center justify-center p-[24px] sm:p-[32px] rounded-[32px] ${m.bg} ${m.hoverBg} border ${m.border} transition-all duration-300 hover:-translate-y-[8px] hover:shadow-2xl hover:shadow-slate-200 active:scale-95`}>
                            <div className={`w-[56px] h-[56px] sm:w-[80px] sm:h-[80px] ${m.color} rounded-[20px] sm:rounded-[28px] flex items-center justify-center shadow-lg ${m.shadow} group-hover:scale-110 transition-transform duration-300 mb-[16px] sm:mb-[24px]`}>
                                <m.icon className="w-[24px] h-[24px] sm:w-[32px] sm:h-[32px] text-white" />
                            </div>
                            <h2 className={`text-[14px] sm:text-[18px] font-black ${m.textColor} tracking-tight group-hover:tracking-wide transition-all text-center`}>{m.title}</h2>
                        </Link>
                    ))}
                </div>

                {/* Footer Quick Links */}
                <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <Link to="/hotel-sector/reports" className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors">
                            <FileText size={18} />
                            <span className="text-xs font-black uppercase tracking-widest">Financial Reports</span>
                        </Link>
                        <Link to="/hotel-sector/settings" className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors">
                            <Settings size={18} />
                            <span className="text-xs font-black uppercase tracking-widest">Configuration</span>
                        </Link>
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">© 2026 OrganizerPro Systems</p>
                </div>
            </div>
        </div>
    );
};

export default HotelHome;
