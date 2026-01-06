import { FaCheck, FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", type = "danger" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] p-8 sm:p-10 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 border border-white font-['Outfit']">
                <div className={`w-20 h-20 ${type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'} rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-sm`}>
                    {type === 'danger' ? <FaExclamationTriangle /> : <FaCheck />}
                </div>

                <h3 className="text-2xl font-black text-slate-900 text-center mb-3 tracking-tight">{title}</h3>

                <p className="text-slate-500 text-xs font-bold text-center mb-8 px-2 leading-relaxed uppercase tracking-widest">
                    {message}
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={onCancel}
                        className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg text-white flex items-center justify-center gap-2 ${type === 'danger'
                                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                            }`}
                    >
                        {type === 'danger' && <FaTimes />}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
