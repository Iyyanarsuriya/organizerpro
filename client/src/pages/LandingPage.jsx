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
    UserCheck
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
                                <div className="flex flex-col gap-6 mb-12">
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Select your workspace:</p>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        <Link
                                            to="/reminders"
                                            className="p-4 rounded-2xl border border-slate-200 hover:border-[#2d5bff] hover:bg-blue-50 transition-all group text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <svg className="w-4 h-4 text-[#2d5bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            </div>
                                            <div className="font-bold text-slate-700 text-sm">Personal Use</div>
                                        </Link>

                                        <Link
                                            to="/attendance"
                                            className="p-4 rounded-2xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50 transition-all group text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                                            </div>
                                            <div className="font-bold text-slate-700 text-sm">School/College</div>
                                        </Link>

                                        <Link
                                            to="/reminders"
                                            className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            </div>
                                            <div className="font-bold text-slate-700 text-sm">IT Sector</div>
                                        </Link>

                                        <Link
                                            to="/team"
                                            className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                            </div>
                                            <div className="font-bold text-slate-700 text-sm">Manufacturing</div>
                                        </Link>

                                        <Link
                                            to="/expenses"
                                            className="p-4 rounded-2xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50 transition-all group text-left col-span-2 lg:col-span-1"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                            </div>
                                            <div className="font-bold text-slate-700 text-sm">Hotel/Food</div>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-6 mb-12">
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Select your industry to start:</p>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        <button
                                            onClick={() => { localStorage.setItem('selectedSector', 'personal'); onSignupClick(); }}
                                            className="p-4 rounded-2xl border border-slate-200 hover:border-[#2d5bff] hover:bg-blue-50 transition-all group text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <svg className="w-4 h-4 text-[#2d5bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            </div>
                                            <div className="font-bold text-slate-700 text-sm">Personal Use</div>
                                        </button>

                                        <button
                                            onClick={() => { localStorage.setItem('selectedSector', 'education'); onSignupClick(); }}
                                            className="p-4 rounded-2xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50 transition-all group text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                                            </div>
                                            <div className="font-bold text-slate-700 text-sm">School/College</div>
                                        </button>

                                        <button
                                            onClick={() => { localStorage.setItem('selectedSector', 'it'); onSignupClick(); }}
                                            className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            </div>
                                            <div className="font-bold text-slate-700 text-sm">IT Sector</div>
                                        </button>

                                        <button
                                            onClick={() => { localStorage.setItem('selectedSector', 'production'); onSignupClick(); }}
                                            className="p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                            </div>
                                            <div className="font-bold text-slate-700 text-sm">Manufacturing</div>
                                        </button>

                                        <button
                                            onClick={() => { localStorage.setItem('selectedSector', 'hotel_restaurant'); onSignupClick(); }}
                                            className="p-4 rounded-2xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50 transition-all group text-left col-span-2 lg:col-span-1"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                            </div>
                                            <div className="font-bold text-slate-700 text-sm">Hotel/Food</div>
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
