import { useState } from 'react';
import { FaPlus, FaTrash, FaTimes, FaTag } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ConfirmModal from '../modals/ConfirmModal';

const LookupManager = ({ options = [], type, title, placeholder, onCreate, onDelete, onClose, onRefresh }) => {
    const [newName, setNewName] = useState('');
    const [loading, setLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setLoading(true);
        try {
            await onCreate({ type, name: newName });
            setNewName('');
            toast.success("Added successfully");
            onRefresh();
        } catch (error) {
            toast.error("Failed to add option");
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
            toast.success("Deleted successfully");
            setDeleteModal({ show: false, id: null });
            onRefresh();
        } catch (error) {
            toast.error("Failed to delete option");
        }
    };

    const filteredOptions = options.filter(opt => opt.type === type);

    return (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] p-[32px] sm:p-[48px] w-full max-w-[550px] shadow-2xl relative animate-in zoom-in-95 duration-300 z-110">
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors"
                >
                    <FaTimes />
                </button>

                <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                    <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                    {title}
                </h2>

                <form onSubmit={handleSubmit} className="mb-8 p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">New Option Name</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={placeholder}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 h-11 text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !newName}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-11 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                        >
                            <FaPlus /> Add Option
                        </button>
                    </div>
                </form>

                <div className="max-h-[300px] overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {filteredOptions.length > 0 ? (filteredOptions.map(opt => (
                        <div key={opt.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <FaTag size={12} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{opt.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteClick(opt.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-100 group-hover:opacity-100 sm:opacity-0"
                            >
                                <FaTrash size={12} />
                            </button>
                        </div>
                    ))) : (
                        <p className="text-center text-slate-400 text-xs font-bold py-8 uppercase tracking-widest italic">No options recorded</p>
                    )}
                </div>

                <ConfirmModal
                    isOpen={deleteModal.show}
                    title="Delete Option?"
                    message="This will remove it from the list. Past transactions using this option will remain unchanged."
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

export default LookupManager;
