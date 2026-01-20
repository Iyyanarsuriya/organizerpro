import { Link } from 'react-router-dom';
import {
    Bell,
    ArrowRight,
    Cloud,
    RefreshCcw,
    TrendingUp,
    Wallet,
    BarChart3,
    Facebook,
    Twitter,
    Linkedin,
    Instagram,
    UserCheck,
    User,
    BookOpen,
    GraduationCap
} from 'lucide-react';

const LandingPage = ({ token, user, onProfileClick, onSignupClick }) => {
    const isLoggedIn = !!token;

    return (
        <div className="bg-[#f8fafc] min-h-screen font-['Outfit',sans-serif] text-slate-800 overflow-x-hidden">


            {/* Hero Section */}
            <section className="pt-[100px] lg:pt-[120px] pb-[80px] px-[20px] sm:px-[30px] relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"></div>

                <div className="max-w-[1280px] mx-auto">
                    <div className="grid lg:grid-cols-2 gap-[40px] lg:gap-[80px] items-center">
                        <div className="animate-in fade-in slide-in-from-left-10 duration-700 text-center lg:text-left">
                            <h1 className="text-[42px] sm:text-[48px] md:text-[60px] lg:text-[72px] font-black text-[#1a1c21] leading-[1.1] mb-[16px] tracking-tight">
                                {isLoggedIn ? (
                                    <>Welcome Back to <span className="text-[#2d5bff]">OrganizerPro</span></>
                                ) : (
                                    <>Your Personal <span className="text-[#2d5bff]">Organizer</span></>
                                )}
                            </h1>
                            <p className="text-[12px] sm:text-[13px] font-black text-slate-400 uppercase tracking-[0.4em] mb-[40px]">
                                PRODUCTIVITY MEETS CONTROL
                            </p>

                            {isLoggedIn ? (
                                <div className="flex flex-wrap gap-[16px] justify-center lg:justify-start mb-[48px]">
                                    <Link to="/reminders" className="inline-flex items-center gap-[12px] bg-[#2d5bff] hover:bg-blue-600 text-white font-black px-[32px] py-[16px] rounded-[16px] shadow-xl shadow-blue-500/10 transition-all active:scale-95 group text-[14px]">
                                        <Bell className="w-[20px] h-[20px]" />
                                        My Reminders
                                    </Link>
                                    <Link to="/expenses" className="inline-flex items-center gap-[12px] bg-[#00d1a0] hover:bg-[#00b890] text-white font-black px-[32px] py-[16px] rounded-[16px] shadow-xl shadow-emerald-500/10 transition-all active:scale-95 group text-[14px]">
                                        <Wallet className="w-[20px] h-[20px]" />
                                        Track Expenses
                                    </Link>
                                </div>
                            ) : (
                                <div className="mb-[60px]">
                                    <p className="text-[14px] font-bold text-slate-500 mb-6 uppercase tracking-wider">Choose your industry to get started:</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <button
                                            onClick={() => {
                                                localStorage.setItem('sector', 'personal');
                                                onSignupClick();
                                            }}
                                            className="bg-white border-2 border-slate-100 hover:border-purple-500 p-5 rounded-2xl group transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 text-left h-full flex flex-col w-full"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-purple-50 group-hover:bg-purple-500 transition-colors flex items-center justify-center mb-4">
                                                <User className="w-6 h-6 text-purple-500 group-hover:text-white transition-colors" />
                                            </div>
                                            <h3 className="font-black text-slate-800 text-base group-hover:text-purple-600 transition-colors break-words">Personal Use</h3>
                                            <p className="text-xs font-bold text-slate-400 mt-auto uppercase tracking-wide">Daily Life & Hobbies</p>
                                        </button>

                                        <button
                                            onClick={() => {
                                                localStorage.setItem('sector', 'education');
                                                onSignupClick();
                                            }}
                                            className="bg-white border-2 border-slate-100 hover:border-orange-500 p-5 rounded-2xl group transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 text-left h-full flex flex-col w-full"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-orange-50 group-hover:bg-orange-500 transition-colors flex items-center justify-center mb-4">
                                                <GraduationCap className="w-6 h-6 text-orange-500 group-hover:text-white transition-colors" />
                                            </div>
                                            <h3 className="font-black text-slate-800 text-base group-hover:text-orange-600 transition-colors break-words">School & College</h3>
                                            <p className="text-xs font-bold text-slate-400 mt-auto uppercase tracking-wide">Academics & Campus</p>
                                        </button>

                                        <button
                                            onClick={() => {
                                                localStorage.setItem('sector', 'it');
                                                onSignupClick();
                                            }}
                                            className="bg-white border-2 border-slate-100 hover:border-emerald-500 p-5 rounded-2xl group transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 text-left h-full flex flex-col w-full"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-emerald-50 group-hover:bg-emerald-500 transition-colors flex items-center justify-center mb-4">
                                                <Cloud className="w-6 h-6 text-emerald-500 group-hover:text-white transition-colors" />
                                            </div>
                                            <h3 className="font-black text-slate-800 text-base group-hover:text-emerald-600 transition-colors break-words">IT Sector</h3>
                                            <p className="text-xs font-bold text-slate-400 mt-auto uppercase tracking-wide">Tech & Corporate</p>
                                        </button>

                                        <button
                                            onClick={() => {
                                                localStorage.setItem('sector', 'production');
                                                onSignupClick();
                                            }}
                                            className="bg-white border-2 border-slate-100 hover:border-blue-500 p-5 rounded-2xl group transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 text-left h-full flex flex-col w-full"
                                        >
                                            <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-500 transition-colors flex items-center justify-center mb-4">
                                                <RefreshCcw className="w-6 h-6 text-blue-500 group-hover:text-white transition-colors" />
                                            </div>
                                            <h3 className="font-black text-slate-800 text-base group-hover:text-blue-600 transition-colors break-words">Manufacturing</h3>
                                            <p className="text-xs font-bold text-slate-400 mt-auto uppercase tracking-wide">Production & Labor</p>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Center Feature Cards */}
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[20px] max-w-[896px] mx-auto lg:mx-0">
                                <Link to="/reminders" className="block">
                                    <div className="p-[24px] sm:p-[32px] rounded-[32px] sm:rounded-[40px] bg-[#eff6ff] border border-blue-100 flex flex-col items-center text-center group cursor-pointer hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 h-full">
                                        <div className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] bg-[#2d5bff] rounded-[20px] sm:rounded-[24px] flex items-center justify-center mb-[20px] sm:mb-[24px] shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                            <Bell className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] text-white" />
                                        </div>
                                        <h3 className="text-[18px] sm:text-[20px] font-black text-[#2d5bff] mb-[8px] sm:mb-[12px]">Reminders</h3>
                                        <p className="text-slate-400 text-[13px] sm:text-[14px] font-medium leading-relaxed mb-[16px]">
                                            Never miss what matters with our smart notification system.
                                        </p>
                                        <div className="mt-auto text-[10px] font-black uppercase text-[#2d5bff] tracking-widest flex items-center gap-[8px] group-hover:gap-[12px] transition-all">
                                            Learn More <ArrowRight className="w-[12px] h-[12px]" />
                                        </div>
                                    </div>
                                </Link>

                                <Link to="/expenses" className="block">
                                    <div className="p-[24px] sm:p-[32px] rounded-[32px] sm:rounded-[40px] bg-[#ecfdf5] border border-emerald-100 flex flex-col items-center text-center group cursor-pointer hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-500 h-full">
                                        <div className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] bg-[#00d1a0] rounded-[20px] sm:rounded-[24px] flex items-center justify-center mb-[20px] sm:mb-[24px] shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                                            <Wallet className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] text-white" />
                                        </div>
                                        <h3 className="text-[18px] sm:text-[20px] font-black text-[#00d1a0] mb-[8px] sm:mb-[12px]">Expense</h3>
                                        <p className="text-slate-400 text-[13px] sm:text-[14px] font-medium leading-relaxed mb-[16px]">
                                            Track spending and manage your budget with absolute ease.
                                        </p>
                                        <div className="mt-auto text-[10px] font-black uppercase text-[#00d1a0] tracking-widest flex items-center gap-[8px] group-hover:gap-[12px] transition-all">
                                            View Features <ArrowRight className="w-[12px] h-[12px]" />
                                        </div>
                                    </div>
                                </Link>

                                <Link to="/attendance" className="block sm:col-span-2 lg:col-span-1">
                                    <div className="p-[24px] sm:p-[32px] rounded-[32px] sm:rounded-[40px] bg-[#fff7ed] border border-orange-100 flex flex-col items-center text-center group cursor-pointer hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-500 h-full">
                                        <div className="w-[56px] h-[56px] sm:w-[64px] sm:h-[64px] bg-orange-500 rounded-[20px] sm:rounded-[24px] flex items-center justify-center mb-[20px] sm:mb-[24px] shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                                            <UserCheck className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] text-white" />
                                        </div>
                                        <h3 className="text-[18px] sm:text-[20px] font-black text-orange-600 mb-[8px] sm:mb-[12px]">Attendance</h3>
                                        <p className="text-slate-400 text-[13px] sm:text-[14px] font-medium leading-relaxed mb-[16px]">
                                            Log presence and track consistency like a pro every single day.
                                        </p>
                                        <div className="mt-auto text-[10px] font-black uppercase text-orange-600 tracking-widest flex items-center gap-[8px] group-hover:gap-[12px] transition-all">
                                            Get Started <ArrowRight className="w-[12px] h-[12px]" />
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        <div className="relative animate-in fade-in slide-in-from-right-10 duration-1000 delay-200 hidden lg:flex justify-end">

                            <div className="relative z-10 scale-105 lg:scale-110">
                                <div className={`navigate-home-container bg-white rounded-[32px] sm:rounded-[48px] p-2 sm:p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-white ${!isLoggedIn ? 'max-w-[450px]' : 'max-w-[550px]'}`}>
                                    <div className="bg-[#1a1c21] rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-2xl p-1.5 sm:p-2">
                                        <div className="aspect-square relative rounded-xl sm:rounded-2xl overflow-hidden bg-white">
                                            <img
                                                src="/landing_illustration.png"
                                                alt="Organizer Display"
                                                className="w-full h-full object-contain transform hover:scale-105 transition-transform duration-700"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div >
            </section >

            {/* Features Icon Row */}
            < section className="py-24 bg-white" >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                                <RefreshCcw className="w-7 h-7 text-blue-500" />
                            </div>
                            <h4 className="font-black text-[#1a1c21] text-base mb-2">Smart Sync</h4>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Work life together</p>
                        </div>
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 group-hover:bg-emerald-100 transition-colors">
                                <BarChart3 className="w-7 h-7 text-emerald-500" />
                            </div>
                            <h4 className="font-black text-[#1a1c21] text-base mb-2">Analytics View</h4>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Real-time insights</p>
                        </div>
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-6 group-hover:bg-orange-100 transition-colors">
                                <UserCheck className="w-7 h-7 text-orange-500" />
                            </div>
                            <h4 className="font-black text-[#1a1c21] text-base mb-2">Attendance Log</h4>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Daily consistency</p>
                        </div>
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:bg-indigo-100 transition-colors">
                                <TrendingUp className="w-7 h-7 text-indigo-500" />
                            </div>
                            <h4 className="font-black text-[#1a1c21] text-base mb-2">Habit Analysis</h4>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Productivity sync</p>
                        </div>
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center mb-6 group-hover:bg-sky-100 transition-colors">
                                <Cloud className="w-7 h-7 text-sky-400" />
                            </div>
                            <h4 className="font-black text-[#1a1c21] text-base mb-2">Cloud Backup</h4>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Never lose data</p>
                        </div>
                    </div>
                </div>
            </section >

            {/* Dark Section - How it Works */}
            < section className="py-32 bg-[#1a1c21] text-white relative" >
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <h2 className="text-4xl font-black mb-16 tracking-tight">How It Works</h2>

                    <div className="grid md:grid-cols-3 gap-8 mb-32">
                        {/* Step 1 */}
                        <div className="bg-white/5 backdrop-blur-sm p-10 rounded-[40px] border border-white/10 hover:border-blue-500/50 transition-all duration-500 group">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/10 group-hover:border-[#2d5bff]/50 transition-all">
                                    <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&h=200&fit=crop" alt="User 1" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-black text-xl">Create Account</h4>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Add step in seconds</p>
                                </div>
                            </div>
                            <p className="text-slate-400 font-medium leading-relaxed">
                                Join our platform and start organizing your life instantly with just a few clicks and a secure login.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-white/5 backdrop-blur-sm p-10 rounded-[40px] border border-white/10 hover:border-emerald-500/50 transition-all duration-500 group">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-20 h-20 rounded-[30px] bg-white/10 flex items-center justify-center text-4xl font-black text-white/20 group-hover:text-[#00d1a0] group-hover:bg-emerald-500/10 transition-all">
                                    2.
                                </div>
                                <div>
                                    <h4 className="font-black text-xl">Log Data</h4>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Add your daily tasks</p>
                                </div>
                            </div>
                            <p className="text-slate-400 font-medium leading-relaxed">
                                Log your daily tasks, set priorities, and keep track of your spending to stay organized and productive.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-white/5 backdrop-blur-sm p-10 rounded-[40px] border border-white/10 hover:border-indigo-500/50 transition-all duration-500 group">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/10 group-hover:border-indigo-500/50 transition-all">
                                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop" alt="User 2" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-black text-xl">Testimonial For Life</h4>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Indispensable Tool!</p>
                                </div>
                            </div>
                            <p className="text-slate-400 font-medium leading-relaxed">
                                "This app has completely changed how I manage my time and money. Absolutely essential for my workflow."
                            </p>
                        </div>
                    </div>

                    {/* Footer Area */}
                    <div className="pt-20 border-t border-white/10 flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="flex items-center gap-6">
                            {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                                <a key={i} href="#" className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-[#2d5bff] hover:border-[#2d5bff] transition-all group">
                                    <Icon className="w-5 h-5 text-white/50 group-hover:text-white" />
                                </a>
                            ))}
                        </div>

                        <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
                            <a href="#" className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-white transition-colors">Terms of Service</a>
                            <a href="#" className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-white transition-colors">Privacy Policy</a>
                        </div>

                        <div className="flex flex-col items-center lg:items-end gap-2">
                            <a href="mailto:contact@organizerpro.com" className="text-sm font-black text-white hover:text-[#2d5bff] transition-colors">Contact Us</a>
                            <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.2em]">
                                @2024 OrganizerPro
                            </p>
                        </div>
                    </div>
                </div>

            </section >
        </div >
    );
};

export default LandingPage;
