import { Link, useNavigate } from 'react-router-dom';
import {
    Bell,
    Wallet,
    ArrowRight,
    ArrowLeft
} from 'lucide-react';

const PersonalDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-[#f8fafc] min-h-screen font-['Outfit',sans-serif] text-slate-800 overflow-x-hidden p-6 lg:p-12">

            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header with Back Button */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-[#2d5bff] hover:border-[#2d5bff] transition-all shadow-sm hover:shadow-md active:scale-95 shrink-0 cursor-pointer"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-[#1a1c21] tracking-tight">Personal Sector</h1>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Manage your daily life</p>
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Reminders Card */}
                    <Link to="/personal/reminders" className="relative group overflow-hidden rounded-[32px] bg-white border border-slate-100 p-8 sm:p-10 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-100/50 transition-colors"></div>

                        <div className="w-16 h-16 bg-[#2d5bff] rounded-[24px] flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform relative z-10">
                            <Bell className="w-8 h-8 text-white" />
                        </div>

                        <h3 className="text-2xl font-black text-[#1a1c21] mb-3 relative z-10 group-hover:text-[#2d5bff] transition-colors">Reminders</h3>
                        <p className="text-slate-500 font-medium leading-relaxed mb-6 relative z-10">
                            Stay on top of your personal tasks, appointments, and daily goals. Never miss a beat.
                        </p>

                        <div className="flex items-center gap-2 text-[#2d5bff] font-black uppercase text-xs tracking-widest relative z-10 group-hover:gap-3 transition-all">
                            Manage Tasks <ArrowRight className="w-4 h-4" />
                        </div>
                    </Link>

                    {/* Expense Tracker Card */}
                    <Link to="/personal/expenses" className="relative group overflow-hidden rounded-[32px] bg-white border border-slate-100 p-8 sm:p-10 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-100/50 transition-colors"></div>

                        <div className="w-16 h-16 bg-[#10b981] rounded-[24px] flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform relative z-10">
                            <Wallet className="w-8 h-8 text-white" />
                        </div>

                        <h3 className="text-2xl font-black text-[#1a1c21] mb-3 relative z-10 group-hover:text-[#10b981] transition-colors">Expense Tracker</h3>
                        <p className="text-slate-500 font-medium leading-relaxed mb-6 relative z-10">
                            Simple, clean tracking for your personal finances. Monitor income and expenses easily.
                        </p>

                        <div className="flex items-center gap-2 text-[#10b981] font-black uppercase text-xs tracking-widest relative z-10 group-hover:gap-3 transition-all">
                            Track Money <ArrowRight className="w-4 h-4" />
                        </div>
                    </Link>

                </div>
            </div>
        </div>
    );
};

export default PersonalDashboard;
