import { useState } from 'react';
import { FaPlus, FaTrash, FaTimes, FaFolder } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ProjectManager = ({ projects, onCreate, onDelete, onClose, onRefresh }) => {
    const [newProjectName, setNewProjectName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

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

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? Transactions will be unlinked.")) return;
        try {
            await onDelete(id);
            toast.success("Project deleted");
            onRefresh();
        } catch (error) {
            toast.error("Failed to delete project");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-slate-400 hover:text-slate-800 transition-colors"
                >
                    <FaTimes />
                </button>

                <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                    <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                    Manage Projects
                </h2>

                <form onSubmit={handleSubmit} className="mb-8 p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Project Name</label>
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="New Project..."
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Description (Optional)</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Details..."
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !newProjectName}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                        >
                            <FaPlus /> Create Project
                        </button>
                    </div>
                </form>

                <div className="max-h-[300px] overflow-y-auto space-y-3 custom-scrollbar">
                    {projects.map(project => (
                        <div key={project.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                                    <FaFolder />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{project.name}</p>
                                    {project.description && <p className="text-[10px] text-slate-400 font-bold">{project.description}</p>}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(project.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ))}
                    {projects.length === 0 && (
                        <p className="text-center text-slate-400 text-xs font-bold py-8 uppercase tracking-widest">No projects found</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectManager;
