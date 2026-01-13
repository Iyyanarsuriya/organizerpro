import { useState, useEffect } from 'react';
import { getNotes, createNote, updateNote, deleteNote } from '../../api/noteApi';
import { FaPlus, FaTrash, FaPen, FaThumbtack, FaArrowLeft, FaSearch } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Notes = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const [notes, setNotes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [color, setColor] = useState('yellow');
    const [isPinned, setIsPinned] = useState(false);

    const colors = [
        { id: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-900', hover: 'hover:bg-yellow-50' },
        { id: 'blue', bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-900', hover: 'hover:bg-blue-50' },
        { id: 'green', bg: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-900', hover: 'hover:bg-emerald-50' },
        { id: 'pink', bg: 'bg-pink-100', border: 'border-pink-200', text: 'text-pink-900', hover: 'hover:bg-pink-50' },
        { id: 'purple', bg: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-900', hover: 'hover:bg-purple-50' },
        { id: 'orange', bg: 'bg-orange-100', border: 'border-orange-200', text: 'text-orange-900', hover: 'hover:bg-orange-50' },
    ];

    const fetchNotes = async () => {
        try {
            const res = await getNotes();
            setNotes(res.data.data);
        } catch (error) {
            toast.error("Failed to load notes");
        }
    };

    useEffect(() => {
        fetchNotes();
        // eslint-disable-next-line
    }, []);

    const resetForm = () => {
        setTitle('');
        setContent('');
        setColor('yellow');
        setIsPinned(false);
        setEditingNote(null);
    };

    const handleCreate = () => {
        resetForm();
        setShowModal(true);
    };

    const handleEdit = (note) => {
        setEditingNote(note);
        setTitle(note.title);
        setContent(note.content);
        setColor(note.color);
        setIsPinned(note.is_pinned);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingNote) {
                await updateNote(editingNote.id, { title, content, color, is_pinned: isPinned });
                toast.success("Note updated!");
            } else {
                await createNote({ title, content, color, is_pinned: isPinned });
                toast.success("Note created!");
            }
            setShowModal(false);
            resetForm();
            fetchNotes();
        } catch (error) {
            toast.error("Failed to save note");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this note?")) return;
        try {
            await deleteNote(id);
            toast.success("Note deleted");
            fetchNotes();
        } catch (error) {
            toast.error("Failed to delete note");
        }
    };

    const filteredNotes = notes
        .filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (a.is_pinned === b.is_pinned) {
                return new Date(b.updated_at) - new Date(a.updated_at);
            }
            return a.is_pinned ? -1 : 1;
        });

    return (
        <div className={`font-['Outfit'] flex flex-col ${isEmbedded ? 'h-full bg-transparent' : 'min-h-screen bg-slate-50'}`}>

            {/* Header Section */}
            {!isEmbedded && (
                <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors text-slate-600 active:scale-95"
                        >
                            <FaArrowLeft size={16} />
                        </button>
                        <div>
                            <h1 className="text-[20px] sm:text-2xl font-black text-slate-900 tracking-tight">My Notes</h1>
                            <p className="hidden sm:block text-xs font-bold text-slate-400 uppercase tracking-widest">Capture your thoughts</p>
                        </div>
                    </div>
                </div>
            )}

            {isEmbedded && (
                <div className="px-4 py-4 flex items-center justify-between shrink-0">
                    <h2 className="text-[18px] sm:text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        <span className="text-2xl">📝</span> My Notes
                    </h2>
                </div>
            )}

            {/* Content Container with internal scroll */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-24 custom-scrollbar">

                {/* Search Bar - Modern & Floating Look */}
                <div className="sticky top-0 z-20 pt-2 pb-6">
                    <div className="relative max-w-2xl mx-auto group">
                        <div className="absolute inset-0 bg-blue-500/5 rounded-2xl blur-lg group-hover:bg-blue-500/10 transition-all"></div>
                        <div className="relative bg-white/80 backdrop-blur-md border border-white/50 shadow-lg rounded-2xl flex items-center p-1 transition-all focus-within:ring-2 focus-within:ring-[#2d5bff]/20 focus-within:border-[#2d5bff]/30">
                            <div className="pl-4 text-slate-400">
                                <FaSearch className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search your sparks of genius..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent border-none px-4 py-3 outline-none text-sm font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Notes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-w-[1600px] mx-auto">
                    {/* Add New Note Card - Visible at start of grid on desktop */}
                    <button
                        onClick={handleCreate}
                        className="hidden sm:flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-slate-200 rounded-[24px] text-slate-400 hover:text-[#2d5bff] hover:border-[#2d5bff]/30 hover:bg-blue-50/50 transition-all group cursor-pointer"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-50 group-hover:bg-white group-hover:shadow-md flex items-center justify-center mb-3 transition-all">
                            <FaPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="font-bold text-sm">Create New Note</span>
                    </button>

                    {filteredNotes.length === 0 && searchQuery ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <FaSearch className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-lg font-black text-slate-400">No notes found</p>
                        </div>
                    ) : filteredNotes.length === 0 && !searchQuery ? (
                        // If no notes at all, the "Create New Note" button is the visual cue, but for mobile we might want a message
                        <div className="col-span-full sm:hidden flex flex-col items-center justify-center py-20 text-center">
                            <p className="text-slate-400 font-medium mb-4">Tap the + button to create your first note!</p>
                        </div>
                    ) : (
                        filteredNotes.map(note => {
                            const style = colors.find(c => c.id === note.color) || colors[0];
                            return (
                                <div
                                    key={note.id}
                                    onClick={() => handleEdit(note)}
                                    className={`${style.bg} border-t-4 ${style.border} p-5 rounded-[24px] shadow-sm cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group flex flex-col min-h-[180px]`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className={`text-[16px] sm:text-lg font-black ${style.text} pr-6 leading-tight line-clamp-2`}>{note.title}</h3>
                                        {note.is_pinned && (
                                            <FaThumbtack className="shrink-0 text-slate-900/40 rotate-45" />
                                        )}
                                    </div>

                                    <div className={`flex-1 text-[12px] sm:text-sm font-medium ${style.text} opacity-80 line-clamp-5 whitespace-pre-wrap mb-4`}>
                                        {note.content}
                                    </div>

                                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-black/5">
                                        <span className={`text-[10px] font-bold ${style.text} opacity-60 uppercase tracking-wider`}>
                                            {new Date(note.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(note); }}
                                                className="p-2 rounded-full bg-white/60 hover:bg-white text-slate-700 transition-colors shadow-sm"
                                            >
                                                <FaPen size={10} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                                                className="p-2 rounded-full bg-white/60 hover:bg-white text-rose-500 transition-colors shadow-sm"
                                            >
                                                <FaTrash size={10} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Mobile Floating Action Button (FAB) */}
            <button
                onClick={handleCreate}
                className="fixed sm:hidden bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform"
            >
                <FaPlus size={24} />
            </button>

            {/* Modern Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div onClick={() => setShowModal(false)} className="absolute inset-0"></div>
                    <form
                        onSubmit={handleSave}
                        className="bg-white w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 shadow-2xl shadow-slate-900/50 animate-in slide-in-from-bottom-10 zoom-in-95 duration-300 relative max-h-[90vh] flex flex-col"
                    >
                        {/* Drag Handle for Mobile */}
                        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>

                        <div className="flex justify-between items-start mb-6 shrink-0">
                            <div>
                                <h2 className="text-[20px] sm:text-2xl font-black text-slate-800 tracking-tight">
                                    {editingNote ? 'Edit Note' : 'New Idea'}
                                </h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsPinned(!isPinned)}
                                    className={`p-3 rounded-2xl transition-all ${isPinned ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                    title="Pin Note"
                                >
                                    <FaThumbtack className={isPinned ? '-rotate-45' : ''} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="p-3 bg-slate-50 rounded-2xl text-slate-500 hover:bg-slate-100 hover:text-rose-500 transition-colors"
                                >
                                    Esc
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                            <input
                                required
                                type="text"
                                placeholder="Give it a title..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full text-[18px] sm:text-2xl font-black text-slate-800 placeholder:text-slate-300 outline-none mb-4 bg-transparent border-none p-0"
                            />

                            <textarea
                                placeholder="Start typing your thoughts..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full min-h-[200px] resize-none text-[14px] sm:text-lg text-slate-600 font-medium placeholder:text-slate-300 outline-none bg-transparent mb-6 custom-scrollbar leading-relaxed"
                            ></textarea>
                        </div>

                        <div className="pt-6 border-t border-slate-100 shrink-0">
                            <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 no-scrollbar">
                                {colors.map(c => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setColor(c.id)}
                                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-[3px] transition-all shrink-0 ${c.bg} ${color === c.id ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent hover:scale-110 hover:shadow-sm'}`}
                                    ></button>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                {editingNote && (
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(editingNote.id)}
                                        className="px-6 py-4 bg-rose-50 text-rose-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-rose-100 transition-colors"
                                    >
                                        <FaTrash size={16} />
                                    </button>
                                )}
                                <button type="submit" className="flex-1 bg-slate-900 text-white rounded-2xl py-4 font-black text-sm uppercase tracking-widest hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                    <FaPlus className={editingNote ? 'hidden' : ''} />
                                    {editingNote ? 'Save Changes' : 'Create Note'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Notes;
