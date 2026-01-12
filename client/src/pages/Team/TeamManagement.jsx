import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaUserPlus, FaTrash, FaUserShield, FaUserTie } from 'react-icons/fa';

const TeamManagement = () => {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'user' });
    const [showModal, setShowModal] = useState(false);
    const location = useLocation();

    const token = localStorage.getItem('token');
    const API_URL = 'http://localhost:5000/api/team'; // Adjust if environment variable needed

    const fetchTeam = async () => {
        try {
            const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
            setTeam(res.data);
        } catch (error) {
            console.error("Fetch team error", error);
            // toast.error("Failed to fetch team members");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeam();

        // Auto-open modal if navigated with state
        if (location.state?.showAddModal) {
            setShowModal(true);
            // Optional: Clear state so it doesn't reopen on refresh? 
            // Actually, keep it simple. It's fine.
        }
    }, [location.state]); // Add dependency to check on navigation updates

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(API_URL, formData, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Team member added successfully!");
            setShowModal(false);
            setFormData({ username: '', email: '', password: '', role: 'user' });
            fetchTeam();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to add team member");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this user?")) return;
        try {
            await axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("User removed");
            fetchTeam();
        } catch (error) {
            toast.error("Failed to remove user");
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Navbar is handled by App.jsx layout */}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Team Management</h1>
                        <p className="text-slate-500 mt-1">Manage access for your organization</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-[#2d5bff] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30"
                    >
                        <FaUserPlus /> Add Member
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#2d5bff]"></div></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {team.length === 0 ? (
                            <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FaUserTie className="text-slate-300 text-2xl" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700">No team members yet</h3>
                                <p className="text-slate-500 text-sm mt-1">Add your employees to give them access.</p>
                            </div>
                        ) : (
                            team.map(user => (
                                <div key={user.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                                        >
                                            <FaTrash className="text-sm" />
                                        </button>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-800 mb-1">{user.username}</h3>
                                    <p className="text-slate-500 text-sm mb-4">{user.email}</p>

                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {user.role}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold">
                                            Added {new Date(user.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Add Member Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-fade-in relative">
                        <h2 className="text-2xl font-black text-slate-800 mb-6">Add Team Member</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Username</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#2d5bff] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-slate-700"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#2d5bff] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-slate-700"
                                    placeholder="john@example.com"
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
                                        className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#2d5bff] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-slate-700"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#2d5bff] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-bold text-slate-700"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
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
                                    className="flex-1 h-12 rounded-xl bg-[#2d5bff] text-white font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                                >
                                    Create Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManagement;
