import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  UserPlus, 
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  Crown,
  MapPin,
  Tag,
  IdCard,
  Home,
  Loader2,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import api from '../api/axios';
import { exportToCSV, exportToPDF, timeAgo } from '../utils/export';

interface Customer {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  id_proof: string;
  address: string;
  room_no: string;
  room_type: string;
  loyalty_status: string;
  created_at: string;
}

interface CustomerStats {
  totalGuests: number;
  newThisWeek: number;
  returningGuests: number;
}

const loyaltyMap: Record<string, string> = {
  'New Guest': 'New',
  'Gold Member': 'Gold',
  'Elite Member': 'Elite',
};

const Customers: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats>({ totalGuests: 0, newThisWeek: 0, returningGuests: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    idProof: '',
    roomNo: '',
    roomType: 'Deluxe Room',
    status: 'New Guest'
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = search ? { search } : {};
      const [custRes, statsRes] = await Promise.all([
        api.get('/customers', { params }),
        api.get('/customers/stats'),
      ]);
      setCustomers(custRes.data);
      setStats(statsRes.data);
    } catch (err: any) {
      toast.error('Failed to load customers: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchCustomers, search]);

  const resetForm = () => {
    setFormData({
      name: '', email: '', phone: '', address: '',
      idProof: '', roomNo: '', roomType: 'Deluxe Room', status: 'New Guest'
    });
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/customers', {
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        id_proof: formData.idProof,
        room_no: formData.roomNo,
        room_type: formData.roomType,
        loyalty_status: loyaltyMap[formData.status] || 'New',
      });
      toast.success(`${formData.name} added successfully!`);
      setIsModalOpen(false);
      resetForm();
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add guest');
    }
  };

  const handleExportCSV = () => {
    if (customers.length === 0) {
      toast.error('No customers to export');
      return;
    }
    exportToCSV(
      'customer-directory',
      ['Name', 'Email', 'Phone', 'ID Proof', 'Address', 'Room No', 'Room Type', 'Loyalty', 'Added'],
      customers.map((c) => [
        c.full_name, c.email, c.phone, c.id_proof, c.address,
        c.room_no, c.room_type, c.loyalty_status, c.created_at,
      ])
    );
    toast.success('Customer list exported as CSV');
  };

  const handleExportPDF = () => {
    if (customers.length === 0) {
      toast.error('No customers to export');
      return;
    }
    exportToPDF(
      'Customer Directory - Drizzle Drop Inn',
      ['Name', 'Email', 'Phone', 'Room', 'Loyalty', 'Added'],
      customers.map((c) => [
        c.full_name, c.email, c.phone,
        c.room_no ? `${c.room_no} (${c.room_type})` : '--',
        c.loyalty_status, timeAgo(c.created_at),
      ])
    );
    toast.success('PDF export opened — use Save as PDF in print dialog');
  };

  const getStatusBadge = (status: string) => {
    const s = status || 'New';
    if (s === 'Elite') return 'bg-black text-elegant-gold';
    if (s === 'Gold') return 'bg-elegant-gold/10 text-elegant-gold';
    return 'bg-gray-100 text-soft-slate';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-5xl font-bold text-primary tracking-tight">Customer Directory</h2>
          <p className="text-soft-slate text-lg mt-2">Manage your guest profiles and loyalty programs.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-soft-slate/20 rounded-xl font-bold text-sm text-soft-slate hover:border-elegant-gold hover:text-elegant-gold transition-all"
          >
            <Download className="w-4 h-4" />
            Export List
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-soft-slate/20 rounded-xl font-bold text-sm text-soft-slate hover:border-elegant-gold hover:text-elegant-gold transition-all"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-elegant-gold text-deep-charcoal rounded-xl font-bold text-sm shadow-xl shadow-elegant-gold/20 hover:scale-[1.02] transition-transform"
          >
            <UserPlus className="w-5 h-5" />
            Add New Guest
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="glass-card p-6 rounded-2xl">
            <p className="text-[10px] font-bold text-soft-slate uppercase tracking-widest mb-1">Total Guests</p>
            <p className="text-3xl font-bold text-primary">{stats.totalGuests.toLocaleString()}</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-green-600 font-bold">
               <Users className="w-4 h-4" /> +{stats.newThisWeek} this week
            </div>
         </div>
         <div className="glass-card p-6 rounded-2xl">
            <p className="text-[10px] font-bold text-soft-slate uppercase tracking-widest mb-1">Returning Guests</p>
            <p className="text-3xl font-bold text-primary">{stats.returningGuests.toLocaleString()}</p>
            <div className="mt-4 w-full h-1.5 bg-background rounded-full">
               <div
                 className="h-full bg-elegant-gold rounded-full"
                 style={{ width: stats.totalGuests > 0 ? `${Math.round((stats.returningGuests / stats.totalGuests) * 100)}%` : '0%' }}
               />
            </div>
         </div>
         <div className="glass-card p-6 rounded-2xl">
            <p className="text-[10px] font-bold text-soft-slate uppercase tracking-widest mb-1">Active Profiles</p>
            <p className="text-3xl font-bold text-primary">{customers.length}</p>
            <div className="mt-4 flex gap-1">
               {[1, 2, 3, 4, 5].map(i => (
                 <Crown key={i} className={`w-4 h-4 ${i <= 4 ? 'text-elegant-gold fill-elegant-gold' : 'text-gray-200'}`} />
               ))}
            </div>
         </div>
      </div>

      <div className="glass-card rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-border-subtle flex justify-between items-center bg-background/30">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-border-subtle rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-elegant-gold focus:border-transparent transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-elegant-gold" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-20 text-soft-slate">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-bold text-primary">No customers yet</p>
            <p className="text-sm mt-1">Add your first guest using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-background text-soft-slate text-[10px] font-bold uppercase tracking-widest border-b border-border-subtle">
                  <th className="px-8 py-4 text-left">Guest / ID Proof</th>
                  <th className="px-8 py-4 text-left">Contact / Address</th>
                  <th className="px-8 py-4 text-left">Membership</th>
                  <th className="px-8 py-4 text-left">Room</th>
                  <th className="px-8 py-4 text-left">Added</th>
                  <th className="px-8 py-4 text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {customers.map((guest) => (
                  <tr key={guest.id} className="hover:bg-background/20 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-background border border-border-subtle overflow-hidden">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(guest.full_name)}&background=random&color=fff`} 
                            alt={guest.full_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary">{guest.full_name}</p>
                          <p className="text-[10px] text-elegant-gold font-bold flex items-center gap-1">
                            <IdCard className="w-3 h-3" /> {guest.id_proof || '--'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-soft-slate">
                          <Mail className="w-3 h-3" /> {guest.email || '--'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-soft-slate">
                          <Phone className="w-3 h-3" /> {guest.phone}
                        </div>
                        {guest.address && (
                          <div className="flex items-center gap-2 text-xs text-soft-slate">
                            <MapPin className="w-3 h-3" /> {guest.address}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(guest.loyalty_status)}`}>
                           {guest.loyalty_status || 'New'}
                         </span>
                         {guest.loyalty_status === 'Elite' && <Crown className="w-4 h-4 text-elegant-gold" />}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {guest.room_no ? (
                        <div className="flex items-center gap-2">
                           <Home className="w-4 h-4 text-elegant-gold" />
                           <span className="text-sm font-bold text-primary">{guest.room_no}</span>
                           <span className="text-[10px] text-soft-slate font-bold uppercase">({guest.room_type})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-soft-slate">--</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs text-soft-slate">
                         <Calendar className="w-3 h-3" /> {timeAgo(guest.created_at)}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 text-soft-slate hover:text-primary hover:bg-background rounded-lg transition-all">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-8 border-t border-border-subtle bg-background/10">
          <p className="text-xs text-soft-slate font-medium text-center w-full">
            Showing {customers.length} customer{customers.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title="Add New Guest Profile"
      >
        <form onSubmit={handleAddGuest} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Full Name</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
                <input 
                  type="text" required value={formData.name}
                  placeholder="e.g. Robert Fox"
                  className="w-full bg-background border-none rounded-xl py-4 pl-12 pr-6 text-sm focus:ring-2 focus:ring-elegant-gold"
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>
            <div className="col-span-1 space-y-2">
              <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
                <input 
                  type="email" value={formData.email}
                  placeholder="robert@example.com"
                  className="w-full bg-background border-none rounded-xl py-4 pl-12 pr-6 text-sm focus:ring-2 focus:ring-elegant-gold"
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
            <div className="col-span-1 space-y-2">
              <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
                <input 
                  type="tel" required value={formData.phone}
                  placeholder="+91 98765 43210"
                  className="w-full bg-background border-none rounded-xl py-4 pl-12 pr-6 text-sm focus:ring-2 focus:ring-elegant-gold"
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Home Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
                <input 
                  type="text" value={formData.address}
                  placeholder="Street, City, Country"
                  className="w-full bg-background border-none rounded-xl py-4 pl-12 pr-6 text-sm focus:ring-2 focus:ring-elegant-gold"
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>
            <div className="col-span-1 space-y-2">
              <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">ID Proof Details</label>
              <div className="relative">
                <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
                <input 
                  type="text" value={formData.idProof}
                  placeholder="e.g. Aadhar / PAN"
                  className="w-full bg-background border-none rounded-xl py-4 pl-12 pr-6 text-sm focus:ring-2 focus:ring-elegant-gold"
                  onChange={(e) => setFormData({...formData, idProof: e.target.value})}
                />
              </div>
            </div>
            <div className="col-span-1 space-y-2">
              <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Room Assignment</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
                  <input 
                    type="text" placeholder="No." value={formData.roomNo}
                    className="w-full bg-background border-none rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-elegant-gold"
                    onChange={(e) => setFormData({...formData, roomNo: e.target.value})}
                  />
                </div>
                <select 
                  value={formData.roomType}
                  className="w-full bg-background border-none rounded-xl py-4 px-4 text-sm focus:ring-2 focus:ring-elegant-gold appearance-none flex-[2]"
                  onChange={(e) => setFormData({...formData, roomType: e.target.value})}
                >
                  <option value="Standard Room">Standard Rm</option>
                  <option value="Deluxe Room">Deluxe Rm</option>
                  <option value="Triple Room">Triple Rm</option>
                </select>
              </div>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Loyalty Tier</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
                <select 
                  value={formData.status}
                  className="w-full bg-background border-none rounded-xl py-4 pl-12 pr-6 text-sm focus:ring-2 focus:ring-elegant-gold appearance-none"
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option>New Guest</option>
                  <option>Gold Member</option>
                  <option>Elite Member</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => { setIsModalOpen(false); resetForm(); }}
              className="flex-1 py-4 border border-border-subtle rounded-xl font-bold text-soft-slate hover:bg-background transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-[2] py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
            >
              Add Guest Profile
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;
