import React, { useState } from 'react';
import {
  User,
  MapPin,
  Shield,
  Globe,
  Save,
  Hotel,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('Hotel Profile');

  const handleSave = () => {
    toast.promise(new Promise(res => setTimeout(res, 1000)), {
      loading: 'Saving configuration...',
      success: 'Settings updated successfully',
      error: 'Failed to save settings'
    });
  };

  const navItems = [
    { name: 'Hotel Profile', icon: Hotel },
    { name: 'My Account', icon: User },
    { name: 'Security', icon: Shield },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-primary tracking-tight">Settings</h2>
          <p className="text-soft-slate text-sm sm:text-lg mt-1 sm:mt-2">Manage your luxury management environment and personal preferences.</p>
        </div>
        <button 
           onClick={handleSave}
           className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-elegant-gold text-deep-charcoal rounded-2xl font-bold hover:scale-[1.02] transition-transform shadow-xl shadow-elegant-gold/20 text-sm whitespace-nowrap"
        >
           <Save className="w-5 h-5" /> Save All Changes
        </button>
      </header>

      <div className="grid grid-cols-12 gap-4 sm:gap-8">
        {/* Navigation Sidebar / Horizontal Tabs on Mobile */}
        <div className="col-span-12 lg:col-span-3">
           <div className="glass-card p-2 sm:p-3 rounded-2xl sm:rounded-[2rem] flex flex-row lg:flex-col overflow-x-auto scrollbar-hide gap-2">
              {navItems.map((item) => (
                <button 
                  key={item.name} 
                  onClick={() => setActiveSection(item.name)}
                  className={`flex-1 lg:flex-initial flex items-center justify-center lg:justify-start gap-2.5 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    activeSection === item.name 
                      ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' 
                      : 'text-soft-slate hover:bg-background hover:text-primary'
                  }`}
                >
                  <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${activeSection === item.name ? 'text-elegant-gold' : ''}`} />
                  {item.name}
                </button>
              ))}
           </div>
        </div>

        {/* Content Dynamic Area */}
        <div className="col-span-12 lg:col-span-9 space-y-6 sm:space-y-8">
           {activeSection === 'Hotel Profile' && (
             <div className="glass-card p-5 sm:p-10 rounded-2xl sm:rounded-[2.5rem] space-y-6 sm:space-y-10">
                <div>
                   <h3 className="text-xl sm:text-2xl font-bold text-primary mb-1 sm:mb-2">Hotel Configuration</h3>
                   <p className="text-xs sm:text-sm text-soft-slate">Publicly visible information for your property.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                   <div className="col-span-1 sm:col-span-1 space-y-2">
                      <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Property Name</label>
                      <input type="text" defaultValue="Drizzle Drop Inn" className="w-full bg-background border-none rounded-2xl py-3.5 sm:py-5 px-4 sm:px-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold" />
                   </div>
                   <div className="col-span-1 sm:col-span-1 space-y-2">
                      <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Official Support Email</label>
                      <input type="email" defaultValue="hospitality@drizzledrop.com" className="w-full bg-background border-none rounded-2xl py-3.5 sm:py-5 px-4 sm:px-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold" />
                   </div>
                   <div className="col-span-1 sm:col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Street Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4 sm:w-5 sm:h-5" />
                        <input type="text" defaultValue="215 H, Dispensary Road, Fern Hill, Ooty, Tamil Nadu 643004" className="w-full bg-background border-none rounded-2xl py-3.5 sm:py-5 pl-11 sm:pl-14 pr-4 sm:pr-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold" />
                      </div>
                   </div>
                   <div className="col-span-1 sm:col-span-1 space-y-2">
                      <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Accounting Currency</label>
                      <select className="w-full bg-background border-none rounded-2xl py-3.5 sm:py-5 px-4 sm:px-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold appearance-none" defaultValue="INR (₹)">
                         <option>INR (₹)</option>
                         <option>USD ($)</option>
                         <option>EUR (€)</option>
                      </select>
                   </div>
                   <div className="col-span-1 sm:col-span-1 space-y-2">
                      <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Primary Language</label>
                      <div className="relative">
                        <Globe className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4 sm:w-5 sm:h-5" />
                        <select className="w-full bg-background border-none rounded-2xl py-3.5 sm:py-5 pl-11 sm:pl-14 pr-4 sm:pr-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold appearance-none">
                          <option>English (US)</option>
                          <option>Hindi (India)</option>
                          <option>French (France)</option>
                        </select>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeSection === 'My Account' && (
             <div className="glass-card p-5 sm:p-10 rounded-2xl sm:rounded-[2.5rem] space-y-6 sm:space-y-10">
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-8 pb-6 sm:pb-10 border-b border-border-subtle">
                   <div className="relative group cursor-pointer">
                      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-background border-4 border-elegant-gold overflow-hidden">
                         <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e" alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Save className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                   </div>
                   <div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-primary">Hari</h3>
                      <p className="text-soft-slate text-sm sm:text-base">Super Admin • Drizzle Drop Inn</p>
                      <span className="mt-2 sm:mt-3 inline-block px-3 sm:px-4 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider">Active Account</span>
                   </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Display Name</label>
                      <input type="text" defaultValue="Hari" className="w-full bg-background border-none rounded-2xl py-3.5 sm:py-5 px-4 sm:px-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Direct Phone</label>
                      <input type="tel" defaultValue="+91 98765 43210" className="w-full bg-background border-none rounded-2xl py-3.5 sm:py-5 px-4 sm:px-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold" />
                   </div>
                   <div className="col-span-1 sm:col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Personal Bio / Notes</label>
                      <textarea defaultValue="Property Manager with over 10 years experience in luxury hospitality management." className="w-full bg-background border-none rounded-2xl py-3.5 sm:py-5 px-4 sm:px-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold min-h-[100px] sm:min-h-[120px]" />
                   </div>
                </div>
             </div>
           )}

           {activeSection === 'Security' && (
             <div className="glass-card p-5 sm:p-10 rounded-2xl sm:rounded-[2.5rem] space-y-6 sm:space-y-10">
                <div>
                   <h3 className="text-xl sm:text-2xl font-bold text-primary mb-1 sm:mb-2">Security & Privacy</h3>
                   <p className="text-xs sm:text-sm text-soft-slate">Manage your credentials and account safety.</p>
                </div>
                <div className="space-y-6 sm:space-y-8">
                   <div className="p-5 sm:p-8 bg-primary/5 rounded-2xl sm:rounded-[2rem] space-y-4 sm:space-y-6">
                      <div className="flex items-center gap-3 sm:gap-4 text-primary font-bold text-sm sm:text-base">
                         <Lock className="w-4 h-4 sm:w-5 sm:h-5" /> Change System Password
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                         <input type="password" placeholder="Current Password" className="w-full bg-white/50 border-none rounded-xl py-3 sm:py-4 px-4 sm:px-6 text-sm" />
                         <input type="password" placeholder="New Password" className="w-full bg-white/50 border-none rounded-xl py-3 sm:py-4 px-4 sm:px-6 text-sm" />
                      </div>
                      <button className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors">Apply New Password</button>
                   </div>

                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-8 border border-border-subtle rounded-2xl sm:rounded-[2rem]">
                      <div className="flex gap-4 sm:gap-6">
                         <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-elegant-gold/10 flex items-center justify-center text-elegant-gold flex-shrink-0">
                            <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                         </div>
                         <div>
                            <p className="font-bold text-primary text-sm sm:text-base">Two-Factor Authentication (2FA)</p>
                            <p className="text-xs text-soft-slate mt-0.5">Add an extra layer of security to your account.</p>
                         </div>
                      </div>
                      <button className="w-full sm:w-auto text-center text-xs font-bold text-elegant-gold px-6 py-2.5 border border-elegant-gold/20 rounded-xl hover:bg-elegant-gold/5 transition-colors whitespace-nowrap">Enable Now</button>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
