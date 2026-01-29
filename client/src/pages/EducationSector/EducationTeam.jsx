import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaUserPlus, FaTrash, FaUserTie, FaTimes, FaEnvelope, FaPhone, FaCalendar, FaChevronLeft, FaBuilding } from 'react-icons/fa';
import ConfirmModal from '../../components/modals/ConfirmModal';

const EducationTeam = () => {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'staff', department: '' });
    const [showModal, setShowModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
    const [selectedUser, setSelectedUser] = useState(null);
    const location = useLocation();

    const token = localStorage.getItem('token');
    const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/education-sector/team`;

    const fetchTeam = async () => {
        try {
            const teamRes = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
            setTeam(teamRes.data);
        } catch (error) {
            console.error("Fetch data error", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeam();

        if (location.state?.showAddModal) {
            setShowModal(true);
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(API_URL, formData, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Staff member added successfully!");
            setShowModal(false);
            setFormData({ username: '', email: '', password: '', role: 'staff', department: '' });
            fetchTeam();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to add staff member");
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteModal({ show: true, id });
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        try {
            await axios.delete(`${API_URL}/${deleteModal.id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("User removed");
            setDeleteModal({ show: false, id: null });
            setSelectedUser(null);
            fetchTeam();
        } catch (error) {
            toast.error("Failed to remove user");
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            <div className="max-w-7xl mx-auto px-[16px] sm:px-[24px] lg:px-[32px] py-[40px]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-[32px] gap-[16px]">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/education-sector"
                            className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-orange-600 hover:border-orange-600 transition-all shadow-sm hover:shadow-md active:scale-95 shrink-0"
                        >
                            <FaChevronLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <h1 className="text-[28px] sm:text-[32px] font-black text-slate-800 tracking-tight leading-tight">Education Staff</h1>
                            <p className="text-slate-500 mt-[4px] text-[14px]">Manage access for teachers and staff</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="w-full sm:w-auto flex items-center justify-center gap-[8px] bg-orange-600 text-white px-[20px] py-[10px] rounded-[12px] font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-500/30 text-[14px]"
                    >
                        <FaUserPlus /> Add Staff
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-[80px]"><div className="animate-spin rounded-full h-[48px] w-[48px] border-t-2 border-orange-600"></div></div>
                ) : (
                    <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                        {team.length === 0 ? (
                            <div className="text-center py-[80px] px-[20px]">
                                <div className="w-[64px] h-[64px] bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-[16px]">
                                    <FaUserTie className="text-slate-300 text-[24px]" />
                                </div>
                                <h3 className="text-[18px] font-bold text-slate-700">No staff members yet</h3>
                                <p className="text-slate-500 text-[14px] mt-[4px]">Add teachers and staff to give them access.</p>
                            </div>
                        ) : (
                            <>
                                {/* Mobile/Tablet View */}
                                <div className="block md:hidden">
                                    <div className="divide-y divide-slate-100">
                                        {team.map(user => (
                                            <div key={user.id} className="p-[20px] flex flex-col gap-[16px]">
                                                {/* Top Row */}
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-[12px]">
                                                        <div className="w-[40px] h-[40px] rounded-full bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-[14px] shadow-sm">
                                                            {user.username.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-[14px] font-bold text-slate-800 leading-tight">{user.username}</h3>
                                                            <p className="text-[12px] text-slate-500 font-medium leading-tight">{user.email}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteClick(user.id)}
                                                        className="w-[32px] h-[32px] flex items-center justify-center rounded-[8px] text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                                                    >
                                                        <FaTrash className="text-[12px]" />
                                                    </button>
                                                </div>

                                                {/* Middle Row */}
                                                <div className="flex items-center gap-[12px] flex-wrap">
                                                    <span className={`inline-flex items-center px-[10px] py-[4px] rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' || user.role === 'owner' ? 'bg-purple-50 text-purple-600' :
                                                        user.role === 'manager' ? 'bg-blue-50 text-blue-600' :
                                                            'bg-orange-50 text-orange-600'
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                    {user.department && (
                                                        <span className="inline-flex items-center gap-1.5 px-[10px] py-[4px] rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                                            <FaBuilding className="text-[10px]" />
                                                            {user.department}
                                                        </span>
                                                    )}
                                                    <span className="text-[11px] text-slate-400 font-bold flex items-center gap-[4px]">
                                                        <FaCalendar className="text-[10px]" />
                                                        {new Date(user.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                {/* Bottom Row */}
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="w-full py-[10px] bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-[12px] hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Desktop View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="px-[32px] py-[20px] text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">User Profile</th>
                                                <th className="px-[32px] py-[20px] text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Role & Access</th>
                                                <th className="px-[32px] py-[20px] text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Department</th>
                                                <th className="px-[32px] py-[20px] text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Joined Date</th>
                                                <th className="px-[32px] py-[20px] text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {team.map(user => (
                                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-[32px] py-[20px]">
                                                        <div className="flex items-center gap-[16px]">
                                                            <div className="w-[40px] h-[40px] rounded-full bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-[14px] shadow-sm">
                                                                {user.username.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <h3 className="text-[14px] font-bold text-slate-800">{user.username}</h3>
                                                                <p className="text-[12px] text-slate-500 font-medium">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-[32px] py-[20px]">
                                                        <span className={`inline-flex items-center px-[12px] py-[4px] rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' || user.role === 'owner' ? 'bg-purple-50 text-purple-600' :
                                                            user.role === 'manager' ? 'bg-blue-50 text-blue-600' :
                                                                'bg-orange-50 text-orange-600'
                                                            }`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-[32px] py-[20px]">
                                                        {user.department ? (
                                                            <span className="inline-flex items-center gap-1.5 px-[10px] py-[4px] rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                                                <FaBuilding className="text-[10px]" />
                                                                {user.department}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="px-[32px] py-[20px]">
                                                        <span className="text-[12px] font-bold text-slate-500">
                                                            {new Date(user.created_at).toLocaleDateString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-[32px] py-[20px] text-right">
                                                        <div className="flex items-center justify-end gap-[12px]">
                                                            <button
                                                                onClick={() => setSelectedUser(user)}
                                                                className="px-[16px] py-[8px] bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-[12px] hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                                                            >
                                                                View Details
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(user.id)}
                                                                className="w-[32px] h-[32px] flex items-center justify-center rounded-[12px] text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                                                title="Delete User"
                                                            >
                                                                <FaTrash className="text-[12px]" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* View Member Details Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-[20px] bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-[32px] p-[24px] sm:p-[32px] shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <button
                            onClick={() => setSelectedUser(null)}
                            className="absolute top-[24px] right-[24px] w-[32px] h-[32px] flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"
                        >
                            <FaTimes />
                        </button>

                        <div className="flex flex-col items-center mb-[32px]">
                            <div className="w-[96px] h-[96px] rounded-full bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-[32px] shadow-xl shadow-orange-500/20 mb-[16px]">
                                {selectedUser.username.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-[24px] font-black text-slate-800">{selectedUser.username}</h2>
                            <div className="flex items-center gap-[8px] mt-[8px]">
                                <span className={`px-[12px] py-[4px] rounded-full text-[10px] font-black uppercase tracking-widest ${selectedUser.role === 'admin' || selectedUser.role === 'owner' ? 'bg-purple-50 text-purple-600' :
                                    selectedUser.role === 'manager' ? 'bg-blue-50 text-blue-600' :
                                        'bg-orange-50 text-orange-600'
                                    }`}>
                                    {selectedUser.role}
                                </span>
                                <span className="text-slate-400 text-[14px]">•</span>
                                <span className="text-[12px] font-bold text-slate-400">ID: #{String(selectedUser.local_id || selectedUser.id).padStart(3, '0')}</span>
                            </div>
                        </div>

                        <div className="space-y-[16px]">
                            <div className="p-[16px] bg-slate-50 rounded-[20px] border border-slate-100 flex items-center gap-[16px]">
                                <div className="w-[40px] h-[40px] bg-white rounded-[12px] flex items-center justify-center text-blue-500 shadow-sm shrink-0">
                                    <FaEnvelope />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                    <p className="font-bold text-slate-800 truncate">{selectedUser.email}</p>
                                </div>
                            </div>

                            <div className="p-[16px] bg-slate-50 rounded-[20px] border border-slate-100 flex items-center gap-[16px]">
                                <div className="w-[40px] h-[40px] bg-white rounded-[12px] flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                                    <FaPhone />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Number</p>
                                    <p className="font-bold text-slate-800">{selectedUser.mobile_number || 'Not Provided'}</p>
                                </div>
                            </div>

                            <div className="p-[16px] bg-slate-50 rounded-[20px] border border-slate-100 flex items-center gap-[16px]">
                                <div className="w-[40px] h-[40px] bg-white rounded-[12px] flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                                    <FaCalendar />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Joined</p>
                                    <p className="font-bold text-slate-800">{new Date(selectedUser.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-[32px] pt-[24px] border-t border-slate-100 flex justify-end">
                            <button onClick={() => handleDeleteClick(selectedUser.id)} className="text-red-500 text-[12px] font-black uppercase tracking-widest hover:text-red-600 flex items-center gap-[8px] px-[16px] py-[8px] hover:bg-red-50 rounded-[10px] transition-colors">
                                <FaTrash /> Remove Member
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={deleteModal.show}
                title="Remove User?"
                message="Are you sure you want to remove this user from the team? This action cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ show: false, id: null })}
                confirmText="Remove"
                cancelText="Cancel"
                type="danger"
            />

            {/* Add Member Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-fade-in relative">
                        <h2 className="text-2xl font-black text-slate-800 mb-6">Add Education Staff</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Username</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all font-bold text-slate-700"
                                    placeholder="Jane Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all font-bold text-slate-700"
                                    placeholder="jane@education.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all font-bold text-slate-700"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all font-bold text-slate-700"
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>


                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Department (Optional)</label>
                                <div className="relative">
                                    <FaBuilding className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all font-bold text-slate-700"
                                        placeholder="e.g. Science, Math"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 h-12 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 h-12 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-500/30"
                                >
                                    Create Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )}
        </div >
    );
};

export default EducationTeam;
