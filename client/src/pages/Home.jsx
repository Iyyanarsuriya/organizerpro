import { Link } from 'react-router-dom';
import {
    Bell,
    Wallet,
    ArrowRight,
    CheckCircle2,
    TrendingUp,
    BarChart3,
    Calendar,
    LayoutDashboard,
    Facebook,
    Twitter,
    Linkedin,
    Instagram,
    UserCheck
} from 'lucide-react';


const Home = ({ onProfileClick }) => {
    // Get user from localStorage for a quick greet
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="bg-[#f8fafc] min-h-screen font-['Outfit',sans-serif] text-slate-800 overflow-x-hidden">

            {/* Hero Section - Welcome Back */}
            <section className="pt-12 lg:pt-20 pb-20 px-4 sm:px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"></div>

                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <div className="animate-in fade-in slide-in-from-left-10 duration-700">
                            <h1 className="text-[36px] sm:text-[48px] md:text-[60px] lg:text-[72px] font-black text-[#1a1c21] leading-[1.1] mb-[16px]">
                                Welcome Back, <span className="text-[#2d5bff]">{user?.username || 'User'}</span>
                            </h1>
                            <p className="text-[12px] sm:text-[13px] font-black text-slate-400 uppercase tracking-[0.4em] mb-[40px]">
                                READY TO CONQUER YOUR DAY?
                            </p>

                            <div className="flex flex-wrap gap-4 mb-12">
                                <Link to="/reminders" className="inline-flex items-center gap-3 bg-[#2d5bff] hover:bg-blue-600 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/10 transition-all active:scale-95 group">
                                    <Bell className="w-5 h-5" />
                                    Launch Reminders
                                </Link>
                                <Link to="/expenses" className="inline-flex items-center gap-3 bg-[#00d1a0] hover:bg-[#00b890] text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/10 transition-all active:scale-95 group">
                                    <Wallet className="w-5 h-5" />
                                    Track Spending
                                </Link>
                                <Link to="/attendance" className="inline-flex items-center gap-3 bg-orange-500 hover:bg-orange-600 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-orange-500/10 transition-all active:scale-95 group">
                                    <UserCheck className="w-5 h-5" />
                                    Check In
                                </Link>
                            </div>

                            {/* Quick Stats Banner */}
                            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-wrap gap-8 items-center max-w-2xl mb-12">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                                        <p className="text-sm font-bold text-slate-800">84% Optimal</p>
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-slate-100 hidden sm:block"></div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasks Today</p>
                                        <p className="text-sm font-bold text-slate-800">Ready to go</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visual mockup or illustration */}
                        <div className="relative animate-in fade-in slide-in-from-right-10 duration-1000 delay-200 hidden lg:flex justify-end">
                            <div className="relative z-10 scale-105 lg:scale-110">
                                <div className="bg-white rounded-[48px] p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-white max-w-[550px]">
                                    <div className="bg-[#1a1c21] rounded-[32px] overflow-hidden shadow-2xl p-2">
                                        <div className="aspect-square relative rounded-2xl overflow-hidden bg-white">
                                            <img
                                                src="/landing_illustration.png"
                                                alt="Dashboard Illustration"
                                                className="w-full h-full object-contain transform hover:scale-105 transition-transform duration-700"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section >

            {/* Quick Actions / Integration Row */}
            < section className="py-24 bg-white" >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-[#1a1c21] mb-2 tracking-tight">Your Productivity Hub</h2>
                        <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">EVERYTHING YOU NEED IN ONE PLACE</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Daily Calendar Card */}
                        <Link to="/reminders" className="p-10 rounded-[40px] bg-[#eff6ff] border border-blue-100 group hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
                            <div className="w-16 h-16 bg-[#2d5bff] rounded-[24px] flex items-center justify-center mb-8 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                <Calendar className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-[#2d5bff] mb-4">Daily Schedule</h3>
                            <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                View all your tasks and appointments for today in a clean, organized list.
                            </p>
                            <span className="text-[10px] font-black uppercase text-[#2d5bff] tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                                Open Reminders <ArrowRight className="w-3 h-3" />
                            </span>
                        </Link>

                        {/* Financial Card */}
                        <Link to="/expenses" className="p-10 rounded-[40px] bg-[#ecfdf5] border border-emerald-100 group hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500">
                            <div className="w-16 h-16 bg-[#00d1a0] rounded-[24px] flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                <BarChart3 className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-[#00d1a0] mb-4">Financial Health</h3>
                            <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                Track every rupee spent and visualize your budget trends in real-time.
                            </p>
                            <span className="text-[10px] font-black uppercase text-[#00d1a0] tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                                Track Expenses <ArrowRight className="w-3 h-3" />
                            </span>
                        </Link>

                        {/* Analysis Card */}
                        <Link to="/finance" className="p-10 rounded-[40px] bg-slate-50 border border-slate-100 group hover:shadow-2xl hover:shadow-slate-500/5 transition-all duration-500">
                            <div className="w-16 h-16 bg-slate-800 rounded-[24px] flex items-center justify-center mb-8 shadow-lg shadow-slate-900/10 group-hover:scale-110 transition-transform">
                                <LayoutDashboard className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-4">Data Analytics</h3>
                            <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                Deep dive into your productivity habits and financial statistics.
                            </p>
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                                View Analysis <ArrowRight className="w-3 h-3" />
                            </span>
                        </Link>

                        {/* Attendance Tracker Card */}
                        <Link to="/attendance" className="p-10 rounded-[40px] bg-[#fff7ed] border border-orange-100 group hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500">
                            <div className="w-16 h-16 bg-orange-500 rounded-[24px] flex items-center justify-center mb-8 shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                                <UserCheck className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-orange-600 mb-4">Check-ins</h3>
                            <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                Log your daily presence and maintain consistency with the attendance log.
                            </p>
                            <span className="text-[10px] font-black uppercase text-orange-600 tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                                Mark Attendance <ArrowRight className="w-3 h-3" />
                            </span>
                        </Link>

                    </div>
                </div>
            </section>

            {/* Premium Footer */}
            < section className="py-32 bg-[#1a1c21] text-white" >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-20 items-center mb-32">
                        <div>
                            <h2 className="text-[32px] sm:text-[40px] font-black leading-[1.1] mb-6 tracking-tight"> Mastery over your life, <br /><span className="text-[#2d5bff]">one task at a time.</span></h2>
                            <p className="text-slate-400 font-medium text-lg max-w-lg mb-10 leading-relaxed">
                                Join 50,000+ high-performers who trust OrganizerPro to manage their daily workflow and financial security.
                            </p>
                            <div className="flex gap-4">
                                {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                                    <a key={i} href="#" className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#2d5bff] hover:border-[#2d5bff] transition-all group">
                                        <Icon className="w-5 h-5 text-white/50 group-hover:text-white" />
                                    </a>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8 lg:justify-end">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Platform</h4>
                                <ul className="space-y-2">
                                    <li><Link to="/reminders" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Reminders</Link></li>
                                    <li><Link to="/expenses" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Expense Tracker</Link></li>
                                    <li><Link to="/attendance" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Attendance Tracker</Link></li>
                                    <li><Link to="/finance" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Statistics</Link></li>
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Account</h4>
                                <ul className="space-y-2">
                                    <li><button onClick={onProfileClick} className="text-sm font-bold text-slate-400 hover:text-white transition-colors cursor-pointer text-left">My Profile</button></li>
                                    <li><button className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Settings</button></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#2d5bff] rounded-xl flex items-center justify-center">
                                <LayoutDashboard className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-black tracking-tighter uppercase italic">OrganizerPro</span>
                        </div>
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                            @2024 OrganizerPro • Built for Performance
                        </p>
                    </div>
                </div>
            </section >
        </div >
    );
};

export default Home;
