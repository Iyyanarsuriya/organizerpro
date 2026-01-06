import { useState } from 'react';
import { Plus, Trash2, X, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from './modals/ConfirmModal';

const CategoryManager = ({ categories, onUpdate, onClose, onCreate, onDelete }) => {
    const [newCategory, setNewCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ show: false, id: null, name: '' });

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        setIsSubmitting(true);
        try {
            await onCreate({ name: newCategory.trim() });
            toast.success("Category added!");
            setNewCategory('');
            onUpdate(); // Trigger refresh in parent
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to add category");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (id, name) => {
        // Warning: This 'General' check might be specific to Reminders.
        if (name === 'General') {
            toast.error("Cannot delete 'General' category");
            return;
        }
        setConfirmModal({ show: true, id, name });
    };

    const confirmDelete = async () => {
        try {
            await onDelete(confirmModal.id);
            toast.success("Category deleted");
            onUpdate();
        } catch (error) {
            toast.error("Failed to delete category");
        } finally {
            setConfirmModal({ show: false, id: null, name: '' });
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-[16px] bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                <div className="bg-white rounded-[32px] p-[24px] sm:p-[32px] w-full max-w-[448px] shadow-2xl animate-in zoom-in-95 duration-200 border border-white">
                    <div className="flex justify-between items-center mb-[24px]">
                        <h3 className="text-[20px] font-black text-slate-800 uppercase tracking-tighter flex items-center gap-[12px]">
                            <Tag className="w-5 h-5 text-blue-500" />
                            Manage Categories
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Add Category Form */}
                    <form onSubmit={handleAdd} className="mb-[32px]">
                        <div className="flex gap-[12px]">
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="New category name..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-[12px] px-[16px] py-[12px] text-slate-800 outline-none focus:border-blue-500 transition-all font-bold text-[14px]"
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-blue-600 text-white p-[12px] rounded-[12px] hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </form>

                    {/* Categories List */}
                    <div className="space-y-[8px] max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {categories.map((cat) => (
                            <div key={cat.id} className="flex justify-between items-center p-[12px] bg-slate-50 rounded-[16px] border border-slate-100 group">
                                <span className="text-[14px] font-black text-slate-700 px-[12px] py-[4px] bg-white rounded-full border border-slate-200">
                                    {cat.name}
                                </span>
                                {cat.name !== 'General' && (
                                    <button
                                        onClick={() => handleDeleteClick(cat.id, cat.name)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {categories.length === 0 && (
                            <p className="text-center text-slate-400 font-bold py-8">No categories yet</p>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmModal.show}
                title="Delete Category?"
                message={`Are you sure you want to delete '${confirmModal.name}'?`}
                onConfirm={confirmDelete}
                onCancel={() => setConfirmModal({ show: false, id: null, name: '' })}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </>
    );
};

export default CategoryManager;
