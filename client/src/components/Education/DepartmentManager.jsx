import { useState } from 'react';
import { FaPlus, FaTrash, FaTimes, FaBuilding } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ConfirmModal from '../modals/ConfirmModal';

const DepartmentManager = ({ departments = [], onCreate, onDelete, onClose, onRefresh, placeholder = "Math, Science, English..." }) => {
    const [newDeptName, setNewDeptName] = useState('');
    const [loading, setLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newDeptName.trim()) return;

        setLoading(true);
        try {
            await onCreate({ name: newDeptName });
            setNewDeptName('');
            toast.success("Department created");
            onRefresh();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create department");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteModal({ show: true, id });
    };

    const confirmDelete = async () => {
        try {
            await onDelete(deleteModal.id);
            toast.success("Department deleted");
            setDeleteModal({ show: false, id: null });
            onRefresh();
        } catch (error) {
            toast.error("Failed to delete department");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] p-[32px] sm:p-[48px] w-full max-w-[550px] shadow-2xl relative animate-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors"
                >
                    <FaTimes />
                </button>

                <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-800">
                    <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
                    Manage Departments
                </h2>

                <form onSubmit={handleSubmit} className="mb-8 p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Department Name</label>
                            <input
                                type="text"
                                value={newDeptName}
                                onChange={(e) => setNewDeptName(e.target.value)}
                                placeholder={placeholder}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 h-11 text-xs font-bold font-['Outfit'] outline-none focus:border-orange-500 transition-all shadow-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !newDeptName}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black h-12 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                        >
                            <FaPlus /> Add Department
                        </button>
                    </div>
                </form>

                <div className="max-h-[300px] overflow-y-auto space-y-3 custom-scrollbar">
                    {departments.length > 0 ? (departments.map(dept => (
                        <div key={dept.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                    <FaBuilding />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{dept.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteClick(dept.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ))) : (
                        <p className="text-center text-slate-400 text-xs font-bold py-8 uppercase tracking-widest">No departments found</p>
                    )}
                </div>

                <ConfirmModal
                    isOpen={deleteModal.show}
                    title="Delete Department?"
                    message="This will remove the department from the list, but staff in this department will remain unchanged."
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteModal({ show: false, id: null })}
                    confirmText="Delete"
                    cancelText="Cancel"
                    type="danger"
                />
            </div>
        </div>
    );
};

export default DepartmentManager;
