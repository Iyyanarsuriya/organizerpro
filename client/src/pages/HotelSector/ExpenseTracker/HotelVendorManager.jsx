import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaEdit, FaTrash, FaPhone, FaEnvelope, FaMapMarkerAlt, FaIdCard, FaBuilding } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../../../api/TeamManagement/hotelVendor';

const HotelVendorManager = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        email: '',
        gst_number: '',
        address: ''
    });

    const fetchVendors = async () => {
        try {
            const res = await getVendors();
            setVendors(res.data.data || []);
        } catch (error) {
            toast.error('Failed to fetch vendors');
        } finally {
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
                toast.success('Vendor updated');
            } else {
                await createVendor(formData);
                toast.success('Vendor added');
            }
            setIsModalOpen(false);
            setEditingVendor(null);
            setFormData({ name: '', contact: '', email: '', gst_number: '', address: '' });
            fetchVendors();
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const handleEdit = (vendor) => {
        setEditingVendor(vendor);
        setFormData({
            name: vendor.name,
            contact: vendor.contact || '',
            email: vendor.email || '',
            gst_number: vendor.gst_number || '',
            address: vendor.address || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this vendor?')) {
            try {
                await deleteVendor(id);
                toast.success('Vendor deleted');
                fetchVendors();
            } catch (error) {
                toast.error('Failed to delete vendor');
            }
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-10">
                <h3 className="text-sm font-black flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                    Hotel Vendors & Suppliers
                </h3>
                <button
                    onClick={() => {
                        setEditingVendor(null);
                        setFormData({ name: '', contact: '', email: '', gst_number: '', address: '' });
                        setIsModalOpen(true);
                    }}
                    className="h-12 bg-slate-900 text-white rounded-2xl px-8 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-black/10"
                >
                    <FaUserPlus size={14} /> Add Vendor
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {vendors.map(vendor => (
                    <div key={vendor.id} className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                                <FaBuilding size={24} />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(vendor)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all">
                                    <FaEdit size={12} />
                                </button>
                                <button onClick={() => handleDelete(vendor.id)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all">
                                    <FaTrash size={12} />
                                </button>
                            </div>
                        </div>
                        <h4 className="text-xl font-black text-slate-900 mb-6">{vendor.name}</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-500">
                                <FaPhone size={12} className="text-slate-300" />
                                <span className="text-[11px] font-bold">{vendor.contact || 'No contact'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500">
                                <FaEnvelope size={12} className="text-slate-300" />
                                <span className="text-[11px] font-bold">{vendor.email || 'No email'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500">
                                <FaIdCard size={12} className="text-slate-300" />
                                <span className="text-[11px] font-bold uppercase tracking-widest text-[9px]">GST: {vendor.gst_number || 'N/A'}</span>
                            </div>
                            <div className="flex items-start gap-3 text-slate-500 pt-2">
                                <FaMapMarkerAlt size={12} className="text-slate-300 mt-1" />
                                <span className="text-[11px] font-bold leading-relaxed">{vendor.address || 'No address provided'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {vendors.length === 0 && !loading && (
                <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[40px] border border-slate-100 shadow-sm mt-10">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                        <FaBuilding size={32} />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-2 text-center">No Vendors Found</h4>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Add your first supplier or service provider</p>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-slate-900 mb-8">{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Vendor Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-3xl px-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                                        placeholder="Service or Company Name"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Contact No.</label>
                                        <input
                                            type="text"
                                            value={formData.contact}
                                            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                                            className="w-full h-14 bg-slate-50 border border-slate-100 rounded-3xl px-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                                            placeholder="Phone"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">GST Number</label>
                                        <input
                                            type="text"
                                            value={formData.gst_number}
                                            onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                                            className="w-full h-14 bg-slate-50 border border-slate-100 rounded-3xl px-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-3xl px-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Office Address</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full h-32 bg-slate-50 border border-slate-100 rounded-3xl p-6 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm resize-none"
                                        placeholder="Full address details"
                                    ></textarea>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 h-14 bg-slate-100 text-slate-400 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 h-14 bg-slate-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-black/10"
                                    >
                                        {editingVendor ? 'Save Changes' : 'Confirm Add'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HotelVendorManager;
