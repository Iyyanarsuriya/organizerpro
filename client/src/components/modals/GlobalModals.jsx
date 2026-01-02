import { X, Camera, Loader2 } from 'lucide-react';
import { useState } from 'react';
import Login from '../../pages/Login';
import Signup from '../../pages/Signup';
import { API_URL } from '../../api/axiosInstance';

const GlobalModals = ({
    showLoginModal,
    setShowLoginModal,
    showSignupModal,
    setShowSignupModal,
    showProfileModal,
    setShowProfileModal,
    isEditingProfile,
    setIsEditingProfile,
    editData,
    setEditData,
    updatingProfile,
    handleUpdateProfile,
    handleFileChange,
    previewImage,
    setPreviewImage,
    user,
    handleLogout,
    setToken
}) => {
    const [imgErr, setImgErr] = useState(false);

    return (
        <>
            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 z-200 flex items-center justify-center p-[16px]">
                    <div className="absolute inset-0 bg-[#0f172a]/70 backdrop-blur-md" onClick={() => setShowLoginModal(false)}></div>
                    <div className="relative animate-in zoom-in duration-300 w-full max-w-[440px] max-h-[95vh] overflow-y-auto custom-scrollbar bg-white/10 rounded-[40px] shadow-2xl">
                        <Login
                            onClose={() => setShowLoginModal(false)}
                            onSwitch={() => { setShowLoginModal(false); setShowSignupModal(true); }}
                            setToken={setToken}
                        />
                    </div>
                </div>
            )}

            {/* Signup Modal */}
            {showSignupModal && (
                <div className="fixed inset-0 z-200 flex items-center justify-center p-[16px]">
                    <div className="absolute inset-0 bg-[#0f172a]/70 backdrop-blur-md" onClick={() => setShowSignupModal(false)}></div>
                    <div className="relative animate-in zoom-in duration-300 w-full max-w-[440px] max-h-[95vh] overflow-y-auto custom-scrollbar bg-white/10 rounded-[40px] shadow-2xl">
                        <Signup
                            onClose={() => setShowSignupModal(false)}
                            onSwitch={() => { setShowSignupModal(false); setShowLoginModal(true); }}
                            setToken={setToken}
                        />
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 z-200 flex items-center justify-center p-[16px] bg-[#0f172a]/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-[440px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white">
                        {/* Header */}
                        <div className="bg-linear-to-br from-[#2d5bff] to-[#6366f1] p-[40px] text-center relative">
                            <button
                                onClick={() => {
                                    setShowProfileModal(false);
                                    setIsEditingProfile(false);
                                    setPreviewImage(null);
                                }}
                                className="absolute top-[24px] right-[24px] w-[36px] h-[36px] rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all cursor-pointer z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="relative group mx-auto w-[120px] h-[120px] mb-[20px]">
                                <div className="w-full h-full rounded-full flex items-center justify-center border-4 border-white shadow-2xl overflow-hidden bg-slate-100 relative">
                                    {(previewImage || (user?.profile_image && !imgErr)) ? (
                                        <img
                                            src={previewImage || `${API_URL}${user?.profile_image}`}
                                            className="w-full h-full object-cover"
                                            alt="Profile"
                                            onError={() => !previewImage && setImgErr(true)}
                                        />
                                    ) : (
                                        <span className="text-[48px] font-black text-[#2d5bff] uppercase">{user?.username ? user.username.charAt(0) : '?'}</span>
                                    )}

                                    {isEditingProfile && (
                                        <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="text-white w-8 h-8" />
                                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <h3 className="text-white text-[24px] font-black tracking-tight">{user?.username}</h3>
                            <p className="text-white/70 text-[11px] font-black uppercase tracking-widest mt-1">
                                {isEditingProfile ? 'Edit your information' : 'Member Account'}
                            </p>
                        </div>

                        {/* Content */}
                        <div className="p-[40px] pt-[32px]">
                            {isEditingProfile ? (
                                <form onSubmit={handleUpdateProfile} className="space-y-[20px] animate-in slide-in-from-bottom-4 duration-300">
                                    <div className="space-y-[12px]">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[6px] ml-1">Username</label>
                                            <input
                                                type="text"
                                                value={editData.username}
                                                onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 p-[14px] rounded-[18px] text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[6px] ml-1">Email Address</label>
                                            <input
                                                type="email"
                                                value={user?.email || ''}
                                                readOnly
                                                className="w-full bg-slate-100 border border-slate-200 p-[14px] rounded-[18px] text-[13px] font-bold text-slate-400 outline-none cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-[6px] ml-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                value={editData.mobile_number}
                                                onChange={(e) => setEditData({ ...editData, mobile_number: e.target.value })}
                                                placeholder="Enter mobile number"
                                                className="w-full bg-slate-50 border border-slate-100 p-[14px] rounded-[18px] text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditingProfile(false);
                                                setPreviewImage(null);
                                            }}
                                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-[16px] rounded-[22px] text-[12px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={updatingProfile}
                                            className="flex-1 bg-linear-to-r from-[#2d5bff] to-[#6366f1] text-white py-[16px] rounded-[22px] text-[12px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                                        >
                                            {updatingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-[24px] animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-[12px]">
                                        <div className="flex items-center gap-[16px] p-[16px] bg-slate-50 rounded-[20px] border border-slate-100 group">
                                            <div className="w-[44px] h-[44px] bg-blue-50 rounded-[12px] flex items-center justify-center text-[#2d5bff] group-hover:scale-110 transition-transform">
                                                <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Username</p>
                                                <p className="text-[13px] font-bold text-slate-700">{user?.username}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-[16px] p-[16px] bg-slate-50 rounded-[20px] border border-slate-100 group">
                                            <div className="w-[44px] h-[44px] bg-blue-50 rounded-[12px] flex items-center justify-center text-[#2d5bff] group-hover:scale-110 transition-transform">
                                                <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z" /></svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Email Address</p>
                                                <p className="text-[13px] font-bold text-slate-700 truncate">{user?.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-[16px] p-[16px] bg-slate-50 rounded-[20px] border border-slate-100 group">
                                            <div className="w-[44px] h-[44px] bg-emerald-50 rounded-[12px] flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                                <svg className="w-[20px] h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Phone Number</p>
                                                <p className="text-[13px] font-bold text-slate-700">{user?.mobile_number || 'Not provided'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => {
                                                setEditData({ username: user?.username || '', mobile_number: user?.mobile_number || '' });
                                                setIsEditingProfile(true);
                                            }}
                                            className="flex-1 bg-slate-900 text-white py-[16px] rounded-[22px] text-[12px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 cursor-pointer shadow-xl shadow-slate-900/10"
                                        >
                                            Edit Profile
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-500 py-[16px] rounded-[22px] text-[12px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GlobalModals;
