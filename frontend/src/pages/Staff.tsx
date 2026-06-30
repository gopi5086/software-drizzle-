import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Clock, 
  MoreHorizontal,
  Mail,
  UserCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import api from '../api/axios';

interface StaffMember {
  id: number;
  full_name: string;
  email: string;
  role: string;
  phone: string;
  status: string;
  created_at: string;
}

interface StaffStats {
  totalStaff: number;
  adminCount: number;
  activeCount: number;
}

const Staff: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<StaffStats>({ totalStaff: 0, adminCount: 0, activeCount: 0 });
  const [loading, setLoading] = useState(true);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'staff',
    password: '',
    phone: '',
    status: 'active'
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const [staffRes, statsRes] = await Promise.all([
        api.get('/staff'),
        api.get('/staff/stats'),
      ]);
      setStaffList(staffRes.data);
      setStats(statsRes.data);
    } catch (err: any) {
      toast.error('Failed to load staff: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await api.put(`/staff/${editingStaff.id}`, {
          full_name: formData.name,
          role: formData.role,
          phone: formData.phone,
          status: formData.status,
          password: formData.password || undefined // Only send if changed
        });
        toast.success(`Updated ${formData.name}`);
      } else {
        await api.post('/staff', {
          full_name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone,
        });
        toast.success(`Login created for ${formData.name}!`);
      }
      setIsModalOpen(false);
      setEditingStaff(null);
      setFormData({ name: '', email: '', role: 'staff', password: '', phone: '', status: 'active' });
      fetchStaff();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save staff');
    }
  };

  const handleEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setFormData({
      name: member.full_name,
      email: member.email,
      role: member.role,
      password: '', // Don't show password
      phone: member.phone || '',
      status: member.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this staff account?')) return;
    try {
      await api.delete(`/staff/${id}`);
      toast.success('Staff member removed');
      fetchStaff();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-5xl font-bold text-primary tracking-tight">Staff Management</h2>
          <p className="text-soft-slate text-lg mt-2">Manage team accounts, roles, and shift assignments.</p>
        </div>
        <button 
           onClick={() => setIsModalOpen(true)}
           className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
        >
           <UserPlus className="w-5 h-5" />
           Create Staff Login
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="glass-card p-8 rounded-3xl">
            <Users className="w-8 h-8 text-primary mb-4" />
            <p className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Total Staff</p>
            <p className="text-3xl font-bold text-primary mt-1">{stats.totalStaff} Active</p>
         </div>
         <div className="glass-card p-8 rounded-3xl">
            <ShieldCheck className="w-8 h-8 text-green-600 mb-4" />
            <p className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Admins</p>
            <p className="text-3xl font-bold text-primary mt-1">{stats.adminCount}</p>
         </div>
         <div className="glass-card p-8 rounded-3xl">
            <Clock className="w-8 h-8 text-elegant-gold mb-4" />
            <p className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Active Accounts</p>
            <p className="text-3xl font-bold text-primary mt-1">{stats.activeCount}</p>
         </div>
      </div>

      <div className="glass-card rounded-[2.5rem] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-elegant-gold" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-20 text-soft-slate">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-bold text-primary">No staff members yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-background text-soft-slate text-[10px] font-bold uppercase tracking-widest border-b border-border-subtle">
                  <th className="px-8 py-6">Member</th>
                  <th className="px-8 py-6">Role</th>
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {staffList.map((member) => (
                  <tr key={member.id} className="hover:bg-background/20 transition-colors group">
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-border-subtle flex items-center justify-center text-primary shadow-sm font-bold">
                          {member.full_name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary">{member.full_name}</p>
                          <p className="text-[10px] text-soft-slate font-medium lowercase tracking-normal">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <span className="px-3 py-1 bg-primary/5 rounded-lg border border-primary/10 text-sm font-medium text-primary capitalize">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-green-500 shadow-sm shadow-green-500/50' : 'bg-gray-300'}`} />
                         <span className="text-xs font-bold text-primary capitalize">{member.status}</span>
                      </div>
                    </td>
                    <td className="px-8 py-8 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(member)}
                          className="p-3 text-soft-slate hover:text-primary bg-background/50 rounded-xl transition-all hover:scale-105"
                          title="Edit"
                        >
                          <UserCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(member.id)}
                          className="p-3 text-red-400 hover:text-red-500 bg-red-50 rounded-xl transition-all hover:scale-105"
                          title="Delete"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingStaff(null); }} 
        title={editingStaff ? 'Edit Staff Login' : 'Create Staff Login'}
      >
        <form onSubmit={handleSaveStaff} className="space-y-6">
           <div className="space-y-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Full Name</label>
                 <div className="relative">
                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
                    <input 
                      type="text" required value={formData.name}
                      placeholder="e.g. Michael Chen"
                      className="w-full bg-background border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold"
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
                    <input 
                      type="email" required value={formData.email}
                      placeholder="staff@drizzledrop.com"
                      disabled={!!editingStaff}
                      className={`w-full border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold ${editingStaff ? 'bg-gray-100 cursor-not-allowed text-soft-slate' : 'bg-background'}`}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                 </div>
                 {editingStaff && <p className="text-[9px] text-red-500 font-bold uppercase mt-1 ml-1">Staff ID / Email cannot be changed once created</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">System Role</label>
                    <select 
                      value={formData.role}
                      className="w-full bg-background border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold appearance-none"
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                       <option value="staff">Staff</option>
                       <option value="admin">Admin</option>
                    </select>
                 </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">{editingStaff ? 'New Password (optional)' : 'Initial Password'}</label>
                    <input 
                      type="password" required={!editingStaff} value={formData.password}
                      placeholder={editingStaff ? 'Leave blank to keep same' : '••••••••'}
                      className="w-full bg-background border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold"
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Phone Number</label>
                    <input 
                      type="tel" value={formData.phone}
                      placeholder="+91 00000 00000"
                      className="w-full bg-background border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold"
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Account Status</label>
                    <select 
                      value={formData.status}
                      className="w-full bg-background border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold appearance-none"
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                       <option value="active">Active</option>
                       <option value="inactive">Inactive</option>
                    </select>
                  </div>
              </div>
           </div>
           <button type="submit" className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] transition-transform">
              {editingStaff ? 'Save Changes' : 'Create Account'}
           </button>
        </form>
      </Modal>
    </div>
  );
};

export default Staff;
