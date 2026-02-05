import { Link } from 'react-router-dom';
import {
    Bell,
    CalendarCheck,
    Users,
    Wallet
} from 'lucide-react';

const HotelHome = () => {
    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-[20px] sm:p-[40px] font-['Outfit']">
            <div className="max-w-[1280px] mx-auto w-full">
                {/* Header Section */}
                <div className="text-center mb-[40px] sm:mb-[64px]">
                    <h1 className="text-[32px] sm:text-[48px] font-black text-slate-800 tracking-tight mb-[16px]">
                        Hotel Sector <span className="text-blue-600">Hub</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-[14px] sm:text-[16px]">Select a module to manage your Hotel workflow</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[20px] sm:gap-[32px] justify-center max-w-[1200px] mx-auto">

                    {/* Reminders Card */}
                    <Link to="/hotel-sector/reminders" className="group flex flex-col items-center justify-center p-[32px] sm:p-[40px] rounded-[32px] sm:rounded-[40px] bg-blue-50/50 hover:bg-blue-50 border border-blue-100/50 hover:border-blue-200 transition-all duration-300 hover:-translate-y-[8px] hover:shadow-2xl hover:shadow-blue-500/20 active:scale-95">
                        <div className="w-[72px] h-[72px] sm:w-[96px] sm:h-[96px] bg-[#2d5bff] rounded-[24px] sm:rounded-[32px] flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300 mb-[24px] sm:mb-[32px]">
                            <Bell className="w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] text-white fill-current" />
                        </div>
                        <h2 className="text-[20px] sm:text-[24px] font-black text-[#2d5bff] tracking-tight group-hover:tracking-wide transition-all">Reminders</h2>
                    </Link>

                    {/* Attendance Card */}
                    <Link to="/hotel-sector/attendance" className="group flex flex-col items-center justify-center p-[32px] sm:p-[40px] rounded-[32px] sm:rounded-[40px] bg-orange-50/50 hover:bg-orange-50 border border-orange-100/50 hover:border-orange-200 transition-all duration-300 hover:-translate-y-[8px] hover:shadow-2xl hover:shadow-orange-500/20 active:scale-95">
                        <div className="w-[72px] h-[72px] sm:w-[96px] sm:h-[96px] bg-[#ff6b00] rounded-[24px] sm:rounded-[32px] flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300 mb-[24px] sm:mb-[32px]">
                            <CalendarCheck className="w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] text-white" />
                        </div>
                        <h2 className="text-[20px] sm:text-[24px] font-black text-[#ff6b00] tracking-tight group-hover:tracking-wide transition-all">Attendance</h2>
                    </Link>

                    {/* Team Management Card */}
                    <Link to="/hotel-sector/team" className="group flex flex-col items-center justify-center p-[32px] sm:p-[40px] rounded-[32px] sm:rounded-[40px] bg-purple-50/50 hover:bg-purple-50 border border-purple-100/50 hover:border-purple-200 transition-all duration-300 hover:-translate-y-[8px] hover:shadow-2xl hover:shadow-purple-500/20 active:scale-95">
                        <div className="w-[72px] h-[72px] sm:w-[96px] sm:h-[96px] bg-[#8b5cf6] rounded-[24px] sm:rounded-[32px] flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300 mb-[24px] sm:mb-[32px]">
                            <Users className="w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] text-white" />
                        </div>
                        <h2 className="text-[20px] sm:text-[24px] font-black text-[#8b5cf6] tracking-tight group-hover:tracking-wide transition-all">Team</h2>
                    </Link>

                    {/* Expense Tracker Card */}
                    <Link to="/hotel-sector/expenses" className="group flex flex-col items-center justify-center p-[32px] sm:p-[40px] rounded-[32px] sm:rounded-[40px] bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100/50 hover:border-emerald-200 transition-all duration-300 hover:-translate-y-[8px] hover:shadow-2xl hover:shadow-emerald-500/20 active:scale-95">
                        <div className="w-[72px] h-[72px] sm:w-[96px] sm:h-[96px] bg-[#10b981] rounded-[24px] sm:rounded-[32px] flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300 mb-[24px] sm:mb-[32px]">
                            <Wallet className="w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] text-white" />
                        </div>
                        <h2 className="text-[20px] sm:text-[24px] font-black text-[#10b981] tracking-tight group-hover:tracking-wide transition-all">Expenses</h2>
                    </Link>

                </div>
            </div>
        </div>
    );
};

export default HotelHome;

