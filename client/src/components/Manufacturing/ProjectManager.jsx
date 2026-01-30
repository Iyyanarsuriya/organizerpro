import { useState } from 'react';
import { FaPlus, FaTrash, FaTimes, FaFolder } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ConfirmModal from '../modals/ConfirmModal';

const ProjectManager = ({ projects = [], onCreate, onDelete, onClose, onRefresh, isModal = true }) => {
    const [newProjectName, setNewProjectName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const [deleteModal, setDeleteModal] = useState({ show: false, id: null });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        setLoading(true);
        try {
            await onCreate({ name: newProjectName, description });
            setNewProjectName('');
            setDescription('');
            toast.success("Project created");
            onRefresh();
        } catch (error) {
            toast.error("Failed to create project");
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
            toast.success("Project deleted");
            setDeleteModal({ show: false, id: null });
            onRefresh();
        } catch (error) {
            toast.error("Failed to delete project");
        }
    };

    const content = (
        <div className={`${isModal ? 'bg-white rounded-[40px] p-[32px] sm:p-[48px] w-full max-w-[550px] shadow-2xl relative animate-in zoom-in-95 duration-300 z-60' : 'bg-transparent w-full'}`}>
            {isModal && (
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors"
                >
                    <FaTimes />
                </button>
            )}

            <h2 className={`${isModal ? 'text-2xl' : 'text-xl'} font-black mb-8 flex items-center gap-3 text-slate-900`}>
                <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
                {isModal ? 'Manage Projects' : 'Projects'}
            </h2>

            <form onSubmit={handleSubmit} className="mb-8 p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[4px] sm:mb-[6px] md:mb-[7px] ml-[4px] sm:ml-[6px] md:ml-[7px]">Project Name</label>
                        <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="New Project..."
                            className="w-full bg-white border border-slate-200 rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] px-[12px] sm:px-[14px] md:px-[16px] lg:px-[20px] h-[32px] sm:h-[36px] md:h-[38px] lg:h-[44px] text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-bold outline-none focus:border-orange-500 transition-all shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[4px] sm:mb-[6px] md:mb-[7px] ml-[4px] sm:ml-[6px] md:ml-[7px]">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Project description..."
                            rows="2"
                            className="w-full bg-white border border-slate-200 rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] px-[12px] sm:px-[14px] md:px-[16px] lg:px-[20px] py-[8px] text-[11px] sm:text-[12px] md:text-[13px] lg:text-[14px] font-bold outline-none focus:border-orange-500 transition-all shadow-sm resize-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !newProjectName}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black h-[36px] sm:h-[40px] md:h-[42px] lg:h-[48px] rounded-[10px] sm:rounded-[12px] md:rounded-[13px] lg:rounded-[16px] transition-all shadow-lg shadow-orange-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-[10px] sm:text-[11px] md:text-[12px] uppercase tracking-widest"
                    >
                        <FaPlus /> Create Project
                    </button>
                </div>
            </form>

            <div className={`space-y-3 custom-scrollbar ${isModal ? 'max-h-[300px] overflow-y-auto' : ''}`}>
                <div className="grid grid-cols-1 gap-3">
                    {projects.map(project => (
                        <div key={project.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                                    <FaFolder />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{project.name}</p>
                                    {project.description && <p className="text-[10px] text-slate-400 font-bold">{project.description}</p>}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteClick(project.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ))}
                </div>
                {projects.length === 0 && (
                    <p className="text-center text-slate-400 text-xs font-bold py-8 uppercase tracking-widest">No projects found</p>
                )}
            </div>

            <ConfirmModal
                isOpen={deleteModal.show}
                title="Delete Project?"
                message="This action cannot be undone. Transactions linked to this project will lose their association."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteModal({ show: false, id: null })}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );

    if (!isModal) return content;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            {content}
        </div>
    );
};

export default ProjectManager;
