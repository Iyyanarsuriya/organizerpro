import { Link } from 'react-router-dom';
import { FaBell, FaWallet, FaArrowRight } from 'react-icons/fa';

const Home = () => {
    return (
        <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-4 sm:px-6 py-12 bg-transparent relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-1/4 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="w-full max-w-5xl text-center relative z-10">
                <h1 className="text-4xl sm:text-6xl font-black text-slate-800 tracking-tighter mb-4 animate-in fade-in slide-in-from-top-10 duration-700">
                    Your Personal <span className="text-[#2d5bff]">Organizer</span>
                </h1>
                <p className="text-slate-500 text-sm sm:text-lg font-bold uppercase tracking-[0.2em] mb-12 animate-in fade-in slide-in-from-top-10 duration-700 delay-100">
                    Productivity meets Control
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 px-4 sm:px-0">
                    {/* Reminder App Card */}
                    <Link to="/reminders" className="group">
                        <div className="glass h-full p-8 sm:p-10 rounded-[40px] border border-white/50 shadow-2xl hover:shadow-[#2d5bff]/20 hover:border-[#2d5bff]/30 transition-all duration-500 group-hover:-translate-y-2 flex flex-col items-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-linear-to-br from-[#2d5bff] to-[#6366f1] rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-8 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                <FaBell className="text-white text-3xl sm:text-4xl animate-bounce" />
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-4 group-hover:text-[#2d5bff] transition-colors">Reminders</h2>
                            <p className="text-slate-500 text-sm font-bold leading-relaxed mb-8 max-w-[200px]">
                                Never miss a deadline. Stay on top of your daily tasks and priorities.
                            </p>

                            <div className="mt-auto flex items-center gap-2 text-[#2d5bff] font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                                Open Dashboard <FaArrowRight />
                            </div>
                        </div>
                    </Link>

                    {/* Expense Tracker Card */}
                    <Link to="/expense-tracker" className="group">
                        <div className="glass h-full p-8 sm:p-10 rounded-[40px] border border-white/50 shadow-2xl hover:shadow-emerald-500/20 hover:border-emerald-500/30 transition-all duration-500 group-hover:-translate-y-2 flex flex-col items-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-linear-to-br from-emerald-400 to-teal-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 mb-8 transform group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                                <FaWallet className="text-white text-3xl sm:text-4xl" />
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-4 group-hover:text-emerald-600 transition-colors">Expenses</h2>
                            <p className="text-slate-500 text-sm font-bold leading-relaxed mb-8 max-w-[200px]">
                                Track every penny. Monitor your spending habits and save smarter.
                            </p>

                            <div className="mt-auto flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                                Start Tracking <FaArrowRight />
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Footer Quote */}
                <div className="mt-16 animate-in fade-in duration-1000 delay-500">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em]">Design for your daily lifestyle</p>
                </div>
            </div>
        </div>
    );
};

export default Home;
