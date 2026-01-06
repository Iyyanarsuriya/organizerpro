import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransactions, getTransactionStats } from '../../api/transactionApi';
import { updateProfile, getMe } from '../../api/authApi';
import { API_URL } from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { formatAmount } from '../../utils/formatUtils';
import {
    FaWallet, FaArrowLeft, FaUserEdit, FaCamera,
    FaChartPie, FaCreditCard, FaLock, FaBell, FaHistory
} from 'react-icons/fa';

const FinanceProfile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || {});
    const [stats, setStats] = useState({ summary: { total_income: 0, total_expense: 0 }, categories: [] });

    const [editData, setEditData] = useState({
        username: '',
        email: '',
        mobile_number: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [imgErr, setImgErr] = useState(false);

    const fetchData = async () => {
        try {
            const [userRes, statsRes] = await Promise.all([
                getMe(),
                getTransactionStats()
            ]);
            setUser(userRes.data);
            setEditData(userRes.data);
            setStats(statsRes.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch profile");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const formData = new FormData();
            formData.append('username', editData.username);
            formData.append('email', editData.email);
            formData.append('mobile_number', editData.mobile_number || '');
            if (selectedFile) {
                formData.append('profile_image', selectedFile);
            }
            await updateProfile(formData);
            toast.success("Finance Profile updated!");
            fetchData();
        } catch (error) {
            toast.error("Update failed");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div></div>;

    const income = parseFloat(stats.summary?.total_income || 0);
    const expense = parseFloat(stats.summary?.total_expense || 0);
    const totalBalance = income - expense;

    const formatCurrency = (val) => {
        const absVal = Math.abs(val || 0);
        return '₹' + formatAmount(absVal);
    };

    const efficiency = income > 0 ? ((totalBalance / income) * 100).toFixed(0) : 0;

    return (
        <div className="min-h-screen bg-slate-50 p-[16px] sm:p-[32px] lg:p-[48px] font-['Outfit']">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-[16px] sm:gap-[24px] mb-[32px] lg:mb-[48px]">
                    <button onClick={() => navigate('/expense-tracker')} className="w-[40px] h-[40px] sm:w-[48px] sm:h-[48px] rounded-[16px] sm:rounded-[20px] bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-500 hover:border-emerald-500 transition-all shadow-sm shrink-0">
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-[24px] sm:text-[32px] font-black text-slate-800 tracking-tight leading-tight">Finance Profile</h1>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Personal Financial Settings</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Col: User Card & Stats */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Profile Card */}
                        <div className="glass rounded-[32px] p-[24px] sm:p-[32px] border border-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-teal-500/5"></div>
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="relative mb-[24px]">
                                    <div className="w-[96px] h-[96px] sm:w-[128px] sm:h-[128px] rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500 relative">
                                        {(previewImage || (user?.profile_image && !imgErr)) ? (
                                            <img
                                                src={previewImage || `${API_URL}${user?.profile_image}`}
                                                className="w-full h-full object-cover"
                                                alt="Profile"
                                                onError={() => !previewImage && setImgErr(true)}
                                            />
                                        ) : (
                                            <div className="text-[32px] sm:text-[40px] font-black text-emerald-500 uppercase">
                                                {user?.username ? user.username.charAt(0) : '?'}
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute -bottom-[8px] -right-[8px] w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] bg-emerald-500 text-white rounded-[12px] flex items-center justify-center cursor-pointer hover:bg-emerald-600 transition-colors shadow-lg border-2 border-white">
                                        <FaCamera className="text-[12px] sm:text-[14px]" />
                                        <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                    </label>
                                </div>
                                <h2 className="text-[20px] sm:text-[24px] font-black text-slate-800 text-center">{user.username}</h2>
                                <p className="text-slate-400 font-bold text-[13px] sm:text-[14px] mb-[24px] text-center">{user.email}</p>

                                <div className="w-full h-px bg-slate-200 mb-[24px]"></div>

                                <div className="grid grid-cols-2 gap-[16px] w-full text-center">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Worth</p>
                                        <p className={`text-[16px] sm:text-[18px] font-black ${totalBalance >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                            {formatCurrency(totalBalance)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                                        <p className="text-[16px] sm:text-[18px] font-black text-blue-500">
                                            {efficiency}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Menu */}
                        <div className="glass rounded-[32px] p-[16px] border border-white shadow-xl overflow-hidden">
                            <MenuBtn icon={FaChartPie} label="Spending Analysis" color="text-teal-500" onClick={() => navigate('/expenses')} />
                            <MenuBtn icon={FaHistory} label="Attendance History" color="text-orange-500" onClick={() => navigate('/attendance')} />
                        </div>
                    </div>

                    {/* Right Col: Edit Form */}
                    <div className="lg:col-span-2">
                        <div className="glass rounded-[32px] p-[24px] sm:p-[40px] border border-white shadow-2xl">
                            <div className="flex items-center gap-[12px] mb-[32px] sm:mb-[40px]">
                                <div className="w-[8px] h-[32px] bg-emerald-500 rounded-full"></div>
                                <h3 className="text-[20px] sm:text-[24px] font-black text-slate-800">Financial Identity</h3>
                            </div>

                            <form onSubmit={handleUpdate} className="space-y-[24px] sm:space-y-[32px]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px] sm:gap-[32px]">
                                    <InputGroup
                                        label="Display Name"
                                        value={editData.username}
                                        onChange={(val) => setEditData({ ...editData, username: val })}
                                        placeholder="Enter name..."
                                    />
                                    <InputGroup
                                        label="Email Address"
                                        value={editData.email}
                                        onChange={(val) => setEditData({ ...editData, email: val })}
                                        placeholder="email@example.com"
                                    />
                                    <InputGroup
                                        label="Mobile number"
                                        value={editData.mobile_number}
                                        onChange={(val) => setEditData({ ...editData, mobile_number: val })}
                                        placeholder="000-000-0000"
                                    />

                                </div>



                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="w-full bg-[#1a1c21] hover:bg-emerald-600 text-white font-black py-[20px] rounded-[24px] transition-all active:scale-95 shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-[12px] disabled:opacity-50 text-[14px] sm:text-[16px]"
                                >
                                    {updating ? 'Securing data...' : <><FaUserEdit /> Save Changes</>}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MenuBtn = ({ icon: Icon, label, color, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-[12px] sm:p-[16px] rounded-[16px] sm:rounded-[20px] hover:bg-slate-50 transition-colors group">
        <div className="flex items-center gap-[12px] sm:gap-[16px]">
            <div className={`w-[32px] h-[32px] sm:w-[40px] sm:h-[40px] rounded-[10px] sm:rounded-[12px] bg-slate-100 flex items-center justify-center ${color} group-hover:bg-white group-hover:shadow-md transition-all`}>
                <Icon className="text-[12px] sm:text-[14px]" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-800 transition-colors">{label}</span>
        </div>
        <div className="w-[24px] h-[24px] sm:w-[32px] sm:h-[32px] rounded-full flex items-center justify-center text-slate-300 group-hover:text-slate-500 transition-colors">→</div>
    </button>
);

const InputGroup = ({ label, value, onChange, placeholder }) => (
    <div>
        <label className="block text-[10px] sm:text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-[8px] sm:mb-[12px] ml-[4px] sm:ml-[8px]">{label}</label>
        <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-[12px] sm:rounded-[16px] px-[16px] sm:px-[24px] py-[12px] sm:py-[16px] text-[12px] sm:text-[14px] font-bold text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-['Outfit']"
            placeholder={placeholder}
        />
    </div>
);

export default FinanceProfile;
