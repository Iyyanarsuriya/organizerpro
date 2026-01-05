import { useState, useEffect } from 'react';
import { getWorkers, createWorker, updateWorker, deleteWorker } from '../api/workerApi';
import { getTransactions } from '../api/transactionApi';
import toast from 'react-hot-toast';
import { FaTimes, FaPlus, FaEdit, FaTrash, FaUser, FaBriefcase, FaPhone, FaEnvelope, FaHistory, FaMoneyBillWave, FaUniversity } from 'react-icons/fa';

const WorkerManager = ({ onClose, onUpdate }) => {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        phone: '',
        email: '',
        status: 'active'
    });
    const [editingId, setEditingId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
    const [viewingPayments, setViewingPayments] = useState(null); // Worker object
    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);

    const fetchWorkers = async () => {
        try {
            const res = await getWorkers();
            setWorkers(res.data.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch workers");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateWorker(editingId, formData);
                toast.success("Worker updated!");
            } else {
                await createWorker(formData);
                toast.success("Worker added!");
            }
            resetForm();
            fetchWorkers();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error(editingId ? "Failed to update worker" : "Failed to add worker");
        }
    };

    const handleEdit = (worker) => {
        setFormData({
            name: worker.name,
            role: worker.role || '',
            phone: worker.phone || '',
            email: worker.email || '',
            status: worker.status
        });
        setEditingId(worker.id);
    };

    const handleDeleteClick = (id) => {
        setDeleteModal({ show: true, id });
    };

    const confirmDelete = async () => {
        try {
            await deleteWorker(deleteModal.id);
            toast.success("Worker deleted");
            setDeleteModal({ show: false, id: null });
            fetchWorkers();
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error("Failed to delete worker");
        }
    };

    const resetForm = () => {
        setFormData({ name: '', role: '', phone: '', email: '', status: 'active' });
        setEditingId(null);
    };

    const handleViewPayments = async (worker) => {
        setViewingPayments(worker);
        setPaymentsLoading(true);
        try {
            const res = await getTransactions({ workerId: worker.id });
            setPayments(res.data);
        } catch (error) {
            toast.error("Failed to fetch payment history");
        } finally {
            setPaymentsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] p-8 sm:p-10 w-full max-w-4xl shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors"
                >
                    <FaTimes className="text-xl" />
                </button>

                <div className="mb-8">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                        Manage Workers
                    </h2>
                    <p className="text-slate-500 text-sm mt-2 ml-5">Add and manage your team members</p>
                </div>

                {/* Add/Edit Form */}
                <form onSubmit={handleSubmit} className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                                <FaUser className="inline mr-1" /> Name *
                            </label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Worker name"
                                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                                <FaBriefcase className="inline mr-1" /> Role
                            </label>
                            <input
                                type="text"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                placeholder="e.g. Developer, Designer"
                                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                                <FaPhone className="inline mr-1" /> Phone
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Phone number"
                                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                                <FaEnvelope className="inline mr-1" /> Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Email address"
                                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                        >
                            <FaPlus />
                            {editingId ? 'Update Worker' : 'Add Worker'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                {/* Workers List */}
                <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                        All Workers ({workers.length})
                    </h3>
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        </div>
                    ) : workers.length > 0 ? (
                        workers.map(worker => (
                            <div
                                key={worker.id}
                                className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-blue-200 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="text-lg font-black text-slate-900">{worker.name}</h4>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${worker.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {worker.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-500">
                                            {worker.role && (
                                                <div className="flex items-center gap-2">
                                                    <FaBriefcase className="text-slate-400 text-xs" />
                                                    <span className="font-medium">{worker.role}</span>
                                                </div>
                                            )}
                                            {worker.phone && (
                                                <div className="flex items-center gap-2">
                                                    <FaPhone className="text-slate-400 text-xs" />
                                                    <span className="font-medium">{worker.phone}</span>
                                                </div>
                                            )}
                                            {worker.email && (
                                                <div className="flex items-center gap-2">
                                                    <FaEnvelope className="text-slate-400 text-xs" />
                                                    <span className="font-medium">{worker.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleViewPayments(worker)}
                                            className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                            title="Payment History"
                                        >
                                            <FaUniversity />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(worker)}
                                            className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(worker.id)}
                                            className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            <FaUser className="text-4xl mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-bold uppercase tracking-widest">No workers yet</p>
                            <p className="text-xs mt-1">Add your first team member above</p>
                        </div>
                    )}
                </div>

                {/* Custom Delete Confirmation Modal */}
                {deleteModal.show && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-[32px] p-8 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6">
                                <FaTrash />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 text-center mb-2">Delete Worker?</h3>
                            <p className="text-slate-500 text-xs font-bold text-center mb-8 px-2 leading-relaxed">
                                This action cannot be undone. Their past attendance records will remain in the system.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteModal({ show: false, id: null })}
                                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-red-500/20"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment History Modal */}
                {viewingPayments && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white rounded-[40px] p-8 sm:p-10 w-full max-w-2xl shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col">
                            <button
                                onClick={() => setViewingPayments(null)}
                                className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors"
                            >
                                <FaTimes className="text-xl" />
                            </button>

                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                    <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                                    Payment History: {viewingPayments.name}
                                </h2>
                                <p className="text-slate-500 text-sm mt-2 ml-5 uppercase font-bold tracking-widest">Financial records for this worker</p>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                {paymentsLoading ? (
                                    <div className="flex justify-center py-20">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                                    </div>
                                ) : payments.length > 0 ? (
                                    <div className="space-y-4">
                                        {payments.map(p => (
                                            <div key={p.id} className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-200 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${p.type === 'income' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                                        {p.type === 'income' ? <FaPlus /> : <FaMoneyBillWave />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800">{p.title}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.category}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                            <span className="text-[10px] font-bold text-slate-400">{new Date(p.date).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-xl font-black tracking-tighter ${p.type === 'income' ? 'text-blue-600' : 'text-red-600'}`}>
                                                        {p.type === 'income' ? '+' : '-'}₹{p.amount}
                                                    </p>
                                                    {p.project_name && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Sod: {p.project_name}</p>}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-6 border-t border-slate-100 sticky bottom-0 bg-white">
                                            <div className="flex justify-between items-center p-6 bg-slate-900 rounded-[24px] text-white">
                                                <span className="font-black uppercase tracking-widest text-xs">Total Paid</span>
                                                <span className="text-2xl font-black tracking-tighter">
                                                    ₹{payments.reduce((acc, p) => p.type === 'expense' ? acc + parseFloat(p.amount) : acc - parseFloat(p.amount), 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-20 text-slate-400">
                                        <FaHistory className="text-6xl mx-auto mb-4 opacity-10" />
                                        <p className="font-black uppercase tracking-widest text-sm">No payment records found</p>
                                        <p className="text-xs mt-2">Add an expense and link this worker to see history</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkerManager;
