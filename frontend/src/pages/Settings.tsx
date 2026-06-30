import React, { useState } from 'react';
import { 
  User, 
  MapPin, 
  Bell, 
  Shield, 
  Moon, 
  Globe,
  Save,
  Hotel,
  Lock,
  Mail,
  SmartphoneIcon,
  Palette
} from 'lucide-react';
import { toast } from 'sonner';

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState('Hotel Profile');
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState({
    email: true,
    push: false,
    sms: true,
    weekly: true
  });

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
    { name: 'Notifications', icon: Bell },
    { name: 'Security', icon: Shield },
    { name: 'Appearance', icon: Moon },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-bold text-primary tracking-tight">Settings</h2>
          <p className="text-soft-slate text-lg mt-2">Manage your luxury management environment and personal preferences.</p>
        </div>
        <button 
           onClick={handleSave}
           className="flex items-center gap-2 px-8 py-3 bg-elegant-gold text-deep-charcoal rounded-2xl font-bold hover:scale-[1.02] transition-transform shadow-xl shadow-elegant-gold/20"
        >
           <Save className="w-5 h-5" /> Save All Changes
        </button>
      </header>

      <div className="grid grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="col-span-12 lg:col-span-3">
           <div className="glass-card p-3 rounded-[2rem] space-y-2">
              {navItems.map((item) => (
                <button 
                  key={item.name} 
                  onClick={() => setActiveSection(item.name)}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                    activeSection === item.name 
                      ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' 
                      : 'text-soft-slate hover:bg-background hover:text-primary'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${activeSection === item.name ? 'text-elegant-gold' : ''}`} />
                  {item.name}
                </button>
              ))}
           </div>
        </div>

        {/* Content Dynamic Area */}
        <div className="col-span-12 lg:col-span-9 space-y-8">
           {activeSection === 'Hotel Profile' && (
             <div className="glass-card p-10 rounded-[2.5rem] space-y-10">
                <div>
                   <h3 className="text-2xl font-bold text-primary mb-2">Hotel Configuration</h3>
                   <p className="text-sm text-soft-slate">Publicly visible information for your property.</p>
                </div>
                <div className="grid grid-cols-2 gap-8">
                   <div className="col-span-2 md:col-span-1 space-y-2">
                      <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Property Name</label>
                      <input type="text" defaultValue="Drizzle Drop Inn" className="w-full bg-background border-none rounded-2xl py-5 px-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold" />
                   </div>
                   <div className="col-span-2 md:col-span-1 space-y-2">
                      <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Official Support Email</label>
                      <input type="email" defaultValue="hospitality@drizzledrop.com" className="w-full bg-background border-none rounded-2xl py-5 px-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold" />
                   </div>
                   <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Street Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-soft-slate w-5 h-5" />
                        <input type="text" defaultValue="215 H, Dispensary Road, Fern Hill, Ooty, Tamil Nadu 643004" className="w-full bg-background border-none rounded-2xl py-5 pl-14 pr-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold" />
                      </div>
                   </div>
                   <div className="col-span-2 md:col-span-1 space-y-2">
                      <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Accounting Currency</label>
                      <select className="w-full bg-background border-none rounded-2xl py-5 px-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold appearance-none" defaultValue="INR (₹)">
                         <option>INR (₹)</option>
                         <option>USD ($)</option>
                         <option>EUR (€)</option>
                      </select>
                   </div>
                   <div className="col-span-2 md:col-span-1 space-y-2">
                      <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Primary Language</label>
                      <div className="relative">
                        <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-soft-slate w-5 h-5" />
                        <select className="w-full bg-background border-none rounded-2xl py-5 pl-14 pr-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold appearance-none">
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
             <div className="glass-card p-10 rounded-[2.5rem] space-y-10">
                <div className="flex items-center gap-8 pb-10 border-b border-border-subtle">
                   <div className="relative group cursor-pointer">
                      <div className="w-28 h-28 rounded-full bg-background border-4 border-elegant-gold overflow-hidden">
                         <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e" alt="Profile" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Save className="w-6 h-6 text-white" />
                      </div>
                   </div>
                   <div>
                      <h3 className="text-3xl font-bold text-primary">Hari</h3>
                      <p className="text-soft-slate">Super Admin • Drizzle Drop Inn</p>
                      <span className="mt-3 inline-block px-4 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider">Active Account</span>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Display Name</label>
                      <input type="text" defaultValue="Hari" className="w-full bg-background border-none rounded-2xl py-5 px-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Direct Phone</label>
                      <input type="tel" defaultValue="+91 98765 43210" className="w-full bg-background border-none rounded-2xl py-5 px-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold" />
                   </div>
                   <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Personal Bio / Notes</label>
                      <textarea defaultValue="Property Manager with over 10 years experience in luxury hospitality management." className="w-full bg-background border-none rounded-2xl py-5 px-6 text-sm font-bold focus:ring-2 focus:ring-elegant-gold min-h-[120px]" />
                   </div>
                </div>
             </div>
           )}

           {activeSection === 'Notifications' && (
             <div className="glass-card p-10 rounded-[2.5rem] space-y-8">
                <div>
                   <h3 className="text-2xl font-bold text-primary mb-2">Notification Center</h3>
                   <p className="text-sm text-soft-slate">Configure how and when you want to be alerted.</p>
                </div>
                <div className="space-y-4">
                   {[
                     { id: 'email', label: 'Email Alerts', desc: 'Critical system reports and revenue summaries.', icon: Mail },
                     { id: 'push', label: 'Push Notifications', desc: 'Real-time check-in and booking alerts on desktop.', icon: Bell },
                     { id: 'sms', label: 'SMS Notifications', desc: 'Urgent security alerts and staff messages.', icon: SmartphoneIcon },
                     { id: 'weekly', label: 'Weekly Performance Report', desc: 'Detailed PDF sent every Sunday morning.', icon: Save }
                   ].map((item) => (
                     <div key={item.id} className="flex items-center justify-between p-6 bg-background/50 rounded-3xl hover:bg-background transition-colors">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm">
                              <item.icon className="w-6 h-6" />
                           </div>
                           <div>
                              <p className="font-bold text-primary">{item.label}</p>
                              <p className="text-xs text-soft-slate">{item.desc}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => {
                            const key = item.id as keyof typeof isNotificationsEnabled;
                            setIsNotificationsEnabled({...isNotificationsEnabled, [key]: !isNotificationsEnabled[key]});
                            toast.success(`${item.label} ${!isNotificationsEnabled[key] ? 'Enabled' : 'Disabled'}`);
                          }}
                          className={`w-14 h-7 rounded-full relative transition-colors ${isNotificationsEnabled[item.id as keyof typeof isNotificationsEnabled] ? 'bg-elegant-gold' : 'bg-gray-200'}`}
                        >
                           <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${isNotificationsEnabled[item.id as keyof typeof isNotificationsEnabled] ? 'left-8' : 'left-1'}`} />
                        </button>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {activeSection === 'Security' && (
             <div className="glass-card p-10 rounded-[2.5rem] space-y-10">
                <div>
                   <h3 className="text-2xl font-bold text-primary mb-2">Security & Privacy</h3>
                   <p className="text-sm text-soft-slate">Manage your credentials and account safety.</p>
                </div>
                <div className="space-y-8">
                   <div className="p-8 bg-primary/5 rounded-[2rem] space-y-6">
                      <div className="flex items-center gap-4 text-primary font-bold">
                         <Lock className="w-5 h-5" /> Change System Password
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <input type="password" placeholder="Current Password" className="w-full bg-white/50 border-none rounded-xl py-4 px-6 text-sm" />
                         <input type="password" placeholder="New Password" className="w-full bg-white/50 border-none rounded-xl py-4 px-6 text-sm" />
                      </div>
                      <button className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors">Apply New Password</button>
                   </div>

                   <div className="flex items-center justify-between p-8 border border-border-subtle rounded-[2rem]">
                      <div className="flex gap-6">
                         <div className="w-12 h-12 rounded-2xl bg-elegant-gold/10 flex items-center justify-center text-elegant-gold">
                            <Shield className="w-6 h-6" />
                         </div>
                         <div>
                            <p className="font-bold text-primary">Two-Factor Authentication (2FA)</p>
                            <p className="text-xs text-soft-slate">Add an extra layer of security to your account.</p>
                         </div>
                      </div>
                      <button className="text-xs font-bold text-elegant-gold px-6 py-2 border border-elegant-gold/20 rounded-xl hover:bg-elegant-gold/5 transition-colors">Enable Now</button>
                   </div>
                </div>
             </div>
           )}

           {activeSection === 'Appearance' && (
             <div className="glass-card p-10 rounded-[2.5rem] space-y-10">
                <div>
                   <h3 className="text-2xl font-bold text-primary mb-2">Interface Customization</h3>
                   <p className="text-sm text-soft-slate">Personalize your management dashboard experience.</p>
                </div>
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <p className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Theme Mode</p>
                      <div className="flex gap-4">
                         <button className="flex-1 p-4 bg-primary text-white rounded-2xl flex flex-col items-center gap-2 border-2 border-primary">
                            <Moon className="w-6 h-6" />
                            <span className="text-xs font-bold">Deep Charcoal</span>
                         </button>
                         <button className="flex-1 p-4 bg-white text-primary rounded-2xl flex flex-col items-center gap-2 border border-border-subtle hover:bg-background transition-all">
                            <Globe className="w-6 h-6 opacity-30" />
                            <span className="text-xs font-bold opacity-30">Golden White</span>
                         </button>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <p className="text-[10px] font-bold text-soft-slate uppercase tracking-widest pl-1">Brand Primary Color</p>
                      <div className="flex gap-3">
                         {['#D4AF37', '#2A3439', '#e63946', '#457b9d'].map((color) => (
                           <button 
                             key={color} 
                             className={`w-10 h-10 rounded-full border-4 ${color === '#D4AF37' ? 'border-primary' : 'border-transparent shadow-sm'}`}
                             style={{ backgroundColor: color }}
                             onClick={() => toast.success(`Primary color set to ${color}`)}
                           />
                         ))}
                         <button className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center text-soft-slate">
                            <Palette className="w-4 h-4" />
                         </button>
                      </div>
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
