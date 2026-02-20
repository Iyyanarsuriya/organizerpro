import { useState } from 'react';
import { FaPlus, FaTrash, FaTimes, FaTag } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ConfirmModal from '../modals/ConfirmModal';

const RoleManager = ({ roles = [], members = [], onCreate, onDelete, onClose, onRefresh }) => {
    const [newRoleName, setNewRoleName] = useState('');
    const [loading, setLoading] = useState(false);

    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
    const [warningModal, setWarningModal] = useState({ show: false, message: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;

        setLoading(true);
        try {
            await onCreate({ name: newRoleName });
            setNewRoleName('');
            toast.success("Category created");
            onRefresh();
        } catch (error) {
            toast.error("Failed to create category");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (role) => {
        const memberCount = members.filter(m => m.role === role.name).length;
        if (memberCount > 0) {
            setWarningModal({
                show: true,
                message: `Cannot delete '${role.name}'. It is currently assigned to ${memberCount} member(s). Please reassign them before deleting.`
            });
            return;
        }
        setDeleteModal({ show: true, id: role.id });
    };

    const confirmDelete = async () => {
        try {
            await onDelete(deleteModal.id);
            toast.success("Category deleted");
            setDeleteModal({ show: false, id: null });
            onRefresh();
        } catch (error) {
            toast.error("Failed to delete category");
        }
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] p-[32px] sm:p-[48px] w-full max-w-[550px] shadow-2xl relative animate-in zoom-in-95 duration-300 z-110">
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors"
                >
                    <FaTimes />
                </button>

                <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                    <div className="w-2 h-8 bg-purple-500 rounded-full"></div>
                    Manage Categories
                </h2>

                <form onSubmit={handleSubmit} className="mb-8 p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[4px] sm:mb-[6px] md:mb-[7px] ml-[4px] sm:ml-[6px] md:ml-[7px]">Category Name</label>
                            <input
                                type="text"
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                placeholder="Engineer, Worker, Mason..."
                                className="w-full bg-white border border-slate-200 rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] px-[12px] sm:px-[14px] md:px-[16px] lg:px-[20px] h-[32px] sm:h-[36px] md:h-[38px] lg:h-[44px] text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-bold outline-none focus:border-purple-500 transition-all shadow-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !newRoleName}
                            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-black h-[36px] sm:h-[40px] md:h-[42px] lg:h-[48px] rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] transition-all shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-[10px] sm:text-[11px] md:text-[12px] uppercase tracking-widest"
                        >
                            <FaPlus /> Add Category
                        </button>
                    </div>
                </form>

                <div className="max-h-[300px] overflow-y-auto space-y-3 custom-scrollbar">
                    {roles.length > 0 ? (roles.map(role => (
                        <div key={role.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
                                    <FaTag />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{role.name}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {members.filter(m => m.role === role.name).length} Members
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteClick(role)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ))) : (
                        <p className="text-center text-slate-400 text-xs font-bold py-8 uppercase tracking-widest">No categories found</p>
                    )}
                </div>

                {/* Custom Delete Confirmation Modal */}
                <ConfirmModal
                    isOpen={deleteModal.show}
                    title="Delete Category?"
                    message="This will remove the category from the list."
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteModal({ show: false, id: null })}
                    confirmText="Delete"
                    cancelText="Cancel"
                    type="danger"
                    zIndex="z-120"
                />

                {/* Warning Modal */}
                <ConfirmModal
                    isOpen={warningModal.show}
                    title="Cannot Delete Category"
                    message={warningModal.message}
                    onConfirm={() => setWarningModal({ show: false, message: '' })}
                    onCancel={() => setWarningModal({ show: false, message: '' })}
                    confirmText="OK"
                    cancelText=""
                    type="info"
                    singleButton={true}
                    zIndex="z-120"
                />
            </div>
        </div>
    );
};

export default RoleManager;
