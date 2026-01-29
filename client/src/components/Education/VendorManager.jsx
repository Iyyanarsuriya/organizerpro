import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaStore, FaPhone, FaEnvelope, FaMapMarkerAlt, FaTag } from 'react-icons/fa';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../../api/Expense/eduVendor';
import toast from 'react-hot-toast';

const EducationVendorManager = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        category: ''
    });

    const fetchVendors = async () => {
        try {
            const res = await getVendors();
            setVendors(res.data.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch vendors");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingVendor) {
                await updateVendor(editingVendor.id, formData);
                toast.success("Vendor updated");
            } else {
                await createVendor(formData);
                toast.success("Vendor created");
            }
            setShowModal(false);
            setEditingVendor(null);
            setFormData({ name: '', contact_person: '', phone: '', email: '', address: '', category: '' });
            fetchVendors();
        } catch (error) {
            toast.error("Operation failed");
        }
    };

    const handleEdit = (vendor) => {
        setEditingVendor(vendor);
        setFormData({
            name: vendor.name,
            contact_person: vendor.contact_person || '',
            phone: vendor.phone || '',
            email: vendor.email || '',
            address: vendor.address || '',
            category: vendor.category || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this vendor?")) {
            try {
                await deleteVendor(id);
                toast.success("Vendor deleted");
                fetchVendors();
            } catch (error) {
                toast.error("Failed to delete");
            }
        }
    };

    if (loading) return <div className="p-8 text-center">Loading vendors...</div>;

    return (
        <div className="animate-in slide-in-from-right-10 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Vendor Management</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage school suppliers & service providers</p>
                </div>
                <button
                    onClick={() => {
                        setEditingVendor(null);
                        setFormData({ name: '', contact_person: '', phone: '', email: '', address: '', category: '' });
                        setShowModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 group"
                >
                    <FaPlus className="group-hover:rotate-90 transition-transform duration-300" />
                    <span className="text-xs font-black uppercase tracking-widest">Add Vendor</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.map(vendor => (
                    <div key={vendor.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-xl shadow-xs">
                                <FaStore />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(vendor)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><FaEdit /></button>
                                <button onClick={() => handleDelete(vendor.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><FaTrash /></button>
                            </div>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-1">{vendor.name}</h3>
                        <div className="space-y-2 mt-4">
                            {vendor.contact_person && (
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                    <FaTag className="text-slate-300" size={12} />
                                    <span>{vendor.contact_person}</span>
                                </div>
                            )}
                            {vendor.phone && (
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                    <FaPhone className="text-slate-300" size={12} />
                                    <span>{vendor.phone}</span>
                                </div>
                            )}
                            {vendor.email && (
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                    <FaEnvelope className="text-slate-300" size={12} />
                                    <span className="truncate">{vendor.email}</span>
                                </div>
                            )}
                            {vendor.address && (
                                <div className="flex items-start gap-2 text-xs font-bold text-slate-600">
                                    <FaMapMarkerAlt className="text-slate-300 mt-0.5 shrink-0" size={12} />
                                    <span className="line-clamp-2">{vendor.address}</span>
                                </div>
                            )}
                        </div>
                        {vendor.category && (
                            <div className="mt-6 pt-4 border-t border-slate-50">
                                <span className="px-3 py-1 bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-lg">{vendor.category}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {vendors.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No vendors found</p>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                            <h3 className="text-lg font-black">{editingVendor ? 'Edit Vendor' : 'New Vendor'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-white/50 hover:text-white transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Vendor Name</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" placeholder="Enter vendor name..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Contact Person</label>
                                    <input type="text" value={formData.contact_person} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Phone</label>
                                    <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Email</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Category</label>
                                <input type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" placeholder="e.g. Stationery, IT, Maintenance..." />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Address</label>
                                <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all resize-none" rows="2"></textarea>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all uppercase tracking-widest text-xs mt-4">
                                {editingVendor ? 'Update Vendor' : 'Save Vendor'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EducationVendorManager;
