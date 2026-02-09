import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaUserPlus, FaTrash, FaUserTie, FaTimes, FaEnvelope, FaCalendar, FaChevronLeft, FaFolder, FaUsers, FaUserShield, FaIdCard, FaSearch, FaDownload, FaFileCsv, FaFilePdf } from 'react-icons/fa';
import { getProjects } from '../../api/Attendance/hotelAttendance';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

const HotelTeam = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('sub-users'); // 'sub-users' or 'staff'
    const [subUsers, setSubUsers] = useState([]);
    const [staff, setStaff] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [showUserModal, setShowUserModal] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);

    const [deleteModal, setDeleteModal] = useState({ show: false, id: null, type: 'user' });
    const [selectedItem, setSelectedItem] = useState(null);
    const location = useLocation();

    const token = localStorage.getItem('token');
    const TEAM_API = `${import.meta.env.VITE_API_BASE_URL}/api/hotel-sector/team`;
    const STAFF_API = `${import.meta.env.VITE_API_BASE_URL}/api/hotel-sector/members`;
    const SECTOR = 'hotel';

    const [userForm, setUserForm] = useState({ username: '', email: '', password: '', role: 'staff', project_id: '' });
    const [staffForm, setStaffForm] = useState({ name: '', role: '', phone: '', email: '', wage_type: 'daily', daily_wage: 0, project_id: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [teamRes, staffRes, projRes] = await Promise.all([
                axios.get(TEAM_API, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(STAFF_API, { headers: { Authorization: `Bearer ${token}` } }),
                getProjects({ sector: SECTOR })
            ]);
            setSubUsers(teamRes.data);
            setStaff(staffRes.data.data || staffRes.data);
            setProjects(projRes.data.data || projRes.data);
        } catch (error) {
            console.error("Fetch data error", error);
            toast.error("Failed to load team data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
        }
    }, [location.state]);

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(TEAM_API, userForm, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Sub-user added successfully!");
            setShowUserModal(false);
            setUserForm({ username: '', email: '', password: '', role: 'staff', project_id: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to add sub-user");
        }
    };

    const handleStaffSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(STAFF_API, staffForm, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Staff member added successfully!");
            setShowStaffModal(false);
            setStaffForm({ name: '', role: '', phone: '', email: '', wage_type: 'daily', daily_wage: 0, project_id: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to add staff member");
        }
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        try {
            const api = deleteModal.type === 'user' ? `${TEAM_API}/${deleteModal.id}` : `${STAFF_API}/${deleteModal.id}`;
            await axios.delete(api, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Removed successfully");
            setDeleteModal({ show: false, id: null, type: 'user' });
            setSelectedItem(null);
            fetchData();
        } catch (error) {
            toast.error("Failed to remove");
        }
    };

    const filteredSubUsers = subUsers.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredStaff = staff.filter(m =>
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone?.includes(searchTerm) ||
        m.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExport = (format) => {
        const isUser = activeTab === 'sub-users';
        const data = isUser ? filteredSubUsers : filteredStaff;
        const filename = `hotel_${activeTab}_report_${new Date().toISOString().split('T')[0]}`;

        let headers, rows;
        if (isUser) {
            headers = ['ID', 'Username', 'Email', 'Role', 'Department', 'Created At'];
            rows = data.map(u => [
                u.local_id || u.id,
                u.username,
                u.email || 'N/A',
                u.role || 'user',
                u.project_name || 'General',
                new Date(u.created_at).toLocaleDateString()
            ]);
        } else {
            headers = ['Name', 'Role/Designation', 'Phone', 'Email', 'Department', 'Wage Type', 'Wage Amount', 'Status'];
            rows = data.map(m => [
                m.name,
                m.role || 'Staff',
                m.phone || '-',
                m.email || '-',
                m.project_name || 'General',
                m.wage_type,
                m.daily_wage,
                m.status
            ]);
        }

        if (format === 'csv') {
            exportToCSV(headers, rows, filename);
        } else if (format === 'pdf') {
            exportToPDF({
                title: isUser ? 'Hotel Management Access Report' : 'Hotel Staff Records Report',
                period: 'Current Date',
                tableHeaders: headers,
                tableRows: rows,
                filename: filename,
                themeColor: isUser ? [59, 130, 246] : [16, 185, 129]
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-['Outfit']">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/hotel-sector')}
                            className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 transition-all shadow-sm active:scale-95"
                        >
                            <FaChevronLeft />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hotel Team</h1>
                            <p className="text-slate-500 text-sm font-medium">Manage workspace access and staff records</p>
                        </div>
                    </div>

                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab('sub-users')}
                            className={`flex-1 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sub-users' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Sub-Users
                        </button>
                        <button
                            onClick={() => setActiveTab('staff')}
                            className={`flex-1 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'staff' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Staff List
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className={`w-2 h-2 rounded-full ${activeTab === 'sub-users' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                        <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">{activeTab === 'sub-users' ? 'Management Access' : 'Employee Records'}</h2>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        {/* Search Bar */}
                        <div className="relative w-full sm:w-64 group">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-11 pl-11 pr-4 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none font-medium text-sm transition-all shadow-sm"
                            />
                        </div>

                        {/* Export Options */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleExport('csv')}
                                title="Export to CSV"
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90 cursor-pointer"
                            >
                                <FaFileCsv size={16} />
                            </button>
                            <button
                                onClick={() => handleExport('pdf')}
                                title="Export to PDF"
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90 cursor-pointer"
                            >
                                <FaFilePdf size={16} />
                            </button>
                        </div>

                        <button
                            onClick={() => activeTab === 'sub-users' ? setShowUserModal(true) : setShowStaffModal(true)}
                            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg text-xs w-full sm:w-auto ${activeTab === 'sub-users' ? 'bg-blue-600 shadow-blue-500/20 hover:bg-blue-700' : 'bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-700'}`}
                        >
                            <FaUserPlus /> {activeTab === 'sub-users' ? 'Add User' : 'Add Staff'}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div></div>
                ) : (
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
                        {(activeTab === 'sub-users' ? subUsers : staff).length === 0 ? (
                            <div className="text-center py-24 px-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    {activeTab === 'sub-users' ? <FaUserShield size={32} /> : <FaIdCard size={32} />}
                                </div>
                                <h3 className="text-xl font-black text-slate-700">No {activeTab === 'sub-users' ? 'sub-users' : 'staff members'} yet</h3>
                                <p className="text-slate-500 text-sm mt-1">Start by adding your first {activeTab === 'sub-users' ? 'team member with login access.' : 'employee to track attendance.'}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeTab === 'sub-users' ? 'User Identity' : 'Staff Member'}</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeTab === 'sub-users' ? 'Access Level' : 'Designation'}</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeTab === 'sub-users' ? 'Department' : 'Contact / Salary'}</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(activeTab === 'sub-users' ? filteredSubUsers : filteredStaff).map(item => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-full bg-linear-to-br flex items-center justify-center text-white font-black text-sm shadow-sm ${activeTab === 'sub-users' ? 'from-blue-500 to-indigo-600' : 'from-emerald-500 to-teal-600'}`}>
                                                            {(item.username || item.name || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-800">{item.username || item.name}</p>
                                                            <p className="text-xs text-slate-500 font-medium">{item.email || 'No email'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.role === 'admin' ? 'bg-purple-50 text-purple-600' : item.role === 'manager' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'}`}>
                                                        {item.role || 'Staff'}
                                                    </span>
                                                    {activeTab === 'sub-users' && <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase">LOG-IN ENABLED</p>}
                                                </td>
                                                <td className="px-8 py-5">
                                                    {activeTab === 'sub-users' ? (
                                                        item.project_name ? <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-50 text-orange-600 text-[9px] font-black uppercase"><FaFolder /> {item.project_name}</span> : <span className="text-[9px] font-black text-slate-300 uppercase">General</span>
                                                    ) : (
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-700">{item.phone || 'No phone'}</p>
                                                            <p className="text-[9px] font-black text-emerald-600 uppercase mt-1 tracking-tighter">₹{item.daily_wage || 0} / {item.wage_type || 'day'}</p>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5 text-right flex items-center justify-end gap-3">
                                                    <button onClick={() => setSelectedItem(item)} className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-sm">Details</button>
                                                    <button onClick={() => setDeleteModal({ show: true, id: item.id, type: activeTab === 'sub-users' ? 'user' : 'staff' })} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all"><FaTrash size={14} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl relative">
                        <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors"><FaTimes /></button>
                        <div className="flex flex-col items-center mb-8">
                            <div className={`w-24 h-24 rounded-full bg-linear-to-br flex items-center justify-center text-white font-black text-3xl shadow-xl mb-4 ${activeTab === 'sub-users' ? 'from-blue-500 to-indigo-600 shadow-blue-500/20' : 'from-emerald-500 to-teal-600 shadow-emerald-500/20'}`}>
                                {(selectedItem.username || selectedItem.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-2xl font-black text-slate-800">{selectedItem.username || selectedItem.name}</h2>
                            <p className={`text-xs font-black uppercase tracking-widest mt-1 ${activeTab === 'sub-users' ? 'text-blue-600' : 'text-emerald-600'}`}>{selectedItem.role}</p>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4"><FaEnvelope className="text-blue-500" /><div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Access</p><p className="text-sm font-bold text-slate-800">{selectedItem.email || 'N/A'}</p></div></div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4"><FaCalendar className="text-indigo-500" /><div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Managed Since</p><p className="text-sm font-bold text-slate-800">{new Date(selectedItem.created_at).toLocaleDateString()}</p></div></div>
                            {activeTab === 'staff' && (
                                <>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4"><FaUsers className="text-emerald-500" /><div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Employment</p><p className="text-sm font-bold text-slate-800">{selectedItem.employment_nature || 'Permanent'}</p></div></div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4"><FaUserShield className="text-emerald-500" /><div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone</p><p className="text-sm font-bold text-slate-800">{selectedItem.phone || '-'}</p></div></div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-User Modal */}
            {showUserModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl relative">
                        <h2 className="text-2xl font-black text-slate-800 mb-6">Add Access User</h2>
                        <form onSubmit={handleUserSubmit} className="space-y-4">
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Login Username</label><input type="text" required value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition-all font-bold text-slate-700" placeholder="staff_john" /></div>
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Email</label><input type="email" required value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition-all font-bold text-slate-700" placeholder="john@hotel.com" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Password</label><input type="password" required minLength={6} value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition-all font-bold text-slate-700" placeholder="••••••••" /></div>
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Role</label><select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"><option value="staff">Staff</option><option value="manager">Manager</option><option value="admin">Admin</option></select></div>
                            </div>
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Department</label><select value={userForm.project_id} onChange={e => setUserForm({ ...userForm, project_id: e.target.value })} className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"><option value="">General</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                            <div className="flex gap-4 mt-8"><button type="button" onClick={() => setShowUserModal(false)} className="flex-1 h-12 rounded-2xl font-black text-slate-500 uppercase tracking-widest text-[10px] border border-slate-100 hover:bg-slate-50 transition-all">Cancel</button><button type="submit" className="flex-1 h-12 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">Enable Access</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Staff Modal */}
            {showStaffModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl relative">
                        <h2 className="text-2xl font-black text-slate-800 mb-6 font-['Outfit']">Add Staff Member</h2>
                        <form onSubmit={handleStaffSubmit} className="space-y-4">
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Full Name</label><input type="text" required value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700" placeholder="Jane Smith" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Phone</label><input type="text" value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })} className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700" placeholder="+91..." /></div>
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Designation</label><input type="text" value={staffForm.role} onChange={e => setStaffForm({ ...staffForm, role: e.target.value })} className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700" placeholder="Receptionist" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Wage Type</label><select value={staffForm.wage_type} onChange={e => setStaffForm({ ...staffForm, wage_type: e.target.value })} className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"><option value="daily">Daily Wage</option><option value="monthly">Monthly Salary</option></select></div>
                                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Amount (₹)</label><input type="number" value={staffForm.daily_wage} onChange={e => setStaffForm({ ...staffForm, daily_wage: e.target.value })} className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700" placeholder="0" /></div>
                            </div>
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Department</label><select value={staffForm.project_id} onChange={e => setStaffForm({ ...staffForm, project_id: e.target.value })} className="w-full h-12 px-5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"><option value="">General</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                            <div className="flex gap-4 mt-8"><button type="button" onClick={() => setShowStaffModal(false)} className="flex-1 h-12 rounded-2xl font-black text-slate-500 uppercase tracking-widest text-[10px] border border-slate-100 hover:bg-slate-50 transition-all">Cancel</button><button type="submit" className="flex-1 h-12 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20">Add Staff</button></div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={deleteModal.show}
                title={`Remove ${deleteModal.type === 'user' ? 'Sub-User' : 'Staff Member'}?`}
                message={`Are you sure you want to remove this ${deleteModal.type === 'user' ? 'account' : 'record'}? This action cannot be undone.`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ show: false, id: null, type: 'user' })}
                confirmText="Remove"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
};

export default HotelTeam;
