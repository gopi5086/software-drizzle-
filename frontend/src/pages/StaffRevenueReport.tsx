import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  User, 
  IndianRupee,
  Loader2,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';

interface StaffRevenue {
  staff_name: string;
  staff_email: string;
  total_bookings: number;
  total_revenue: number;
}

const StaffRevenueReport: React.FC = () => {
  const [reportData, setReportData] = useState<StaffRevenue[]>([]);
  const [userRole, setUserRole] = useState<string>('admin');
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/staff-revenue?period=${period}`);
      setReportData(res.data.rows || []);
      setUserRole(res.data.role || 'admin');
    } catch (err: any) {
      toast.error('Failed to load report: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period]);

  const totalRevenue = reportData.reduce((acc, curr) => acc + Number(curr.total_revenue), 0);
  const totalBookings = reportData.reduce((acc, curr) => acc + Number(curr.total_bookings), 0);

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-primary tracking-tight">
            {userRole === 'staff' ? 'My Revenue' : 'Staff Revenue'}
          </h2>
          <p className="text-soft-slate text-sm sm:text-lg mt-1 sm:mt-2">
            {userRole === 'staff' ? 'Track your individual financial performance.' : 'Track financial performance per staff member.'}
          </p>
        </div>
        <div className="flex gap-1.5 sm:gap-2 p-1 bg-background rounded-2xl border border-border-subtle w-full sm:w-auto">
          {['daily', 'monthly', 'yearly'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 sm:flex-initial text-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs capitalize transition-all whitespace-nowrap ${
                period === p 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-soft-slate hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="glass-card p-5 sm:p-10 rounded-2xl sm:rounded-[2.5rem] border border-border-subtle">
           <TrendingUp className="w-7 h-7 sm:w-10 sm:h-10 text-primary mb-3 sm:mb-6" />
           <p className="text-[10px] font-black text-soft-slate uppercase tracking-[0.2em] mb-1 sm:mb-2">Total Periodic Revenue</p>
           <p className="text-2xl sm:text-4xl font-black text-primary tracking-tighter">₹ {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="glass-card p-5 sm:p-10 rounded-2xl sm:rounded-[2.5rem] border border-border-subtle">
           <Calendar className="w-7 h-7 sm:w-10 sm:h-10 text-elegant-gold mb-3 sm:mb-6" />
           <p className="text-[10px] font-black text-soft-slate uppercase tracking-[0.2em] mb-1 sm:mb-2">Total Bookings</p>
           <p className="text-2xl sm:text-4xl font-black text-primary tracking-tighter">{totalBookings}</p>
        </div>
        <div className="glass-card p-5 sm:p-10 rounded-2xl sm:rounded-[2.5rem] border border-border-subtle bg-primary shadow-2xl shadow-primary/20">
           <User className="w-7 h-7 sm:w-10 sm:h-10 text-white/50 mb-3 sm:mb-6" />
           <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1 sm:mb-2">Active Contributors</p>
           <p className="text-2xl sm:text-4xl font-black text-white tracking-tighter">{reportData.filter(d => d.total_revenue > 0).length}</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl sm:rounded-[3rem] overflow-hidden border border-border-subtle shadow-2xl">
        <div className="px-4 sm:px-10 py-4 sm:py-8 border-b border-border-subtle bg-white/50 flex justify-between items-center">
           <h3 className="text-lg sm:text-xl font-bold text-primary">
             {userRole === 'staff' ? 'My Performance Overview' : 'Performance Breakdown'}
           </h3>
           <div className="flex gap-4">
              <button className="p-2 sm:p-3 text-soft-slate hover:text-primary bg-background rounded-xl transition-all">
                 <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
           </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20 sm:py-32">
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-elegant-gold" />
          </div>
        ) : reportData.length === 0 ? (
          <div className="text-center py-20 sm:py-32 bg-white/30 backdrop-blur-sm">
            <User className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-soft-slate opacity-20" />
            <p className="text-lg sm:text-xl font-bold text-soft-slate">No revenue data for this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead>
                <tr className="bg-background/50 text-soft-slate text-[10px] font-black uppercase tracking-[0.2em]">
                  <th className="px-4 sm:px-10 py-4 sm:py-8">Staff Member</th>
                  <th className="px-4 sm:px-10 py-4 sm:py-8">Total Bookings</th>
                  <th className="px-4 sm:px-10 py-4 sm:py-8">Revenue Contribution</th>
                  <th className="px-4 sm:px-10 py-4 sm:py-8 text-right">Performance Index</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-primary/5 transition-all duration-300 group">
                    <td className="px-4 sm:px-10 py-4 sm:py-8">
                      <div className="flex items-center gap-3 sm:gap-6">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-white border border-border-subtle shadow-md flex items-center justify-center font-black text-primary text-base sm:text-lg group-hover:scale-110 transition-transform">
                          {row.staff_name?.[0] || 'S'}
                        </div>
                        <div>
                          <p className="text-sm sm:text-lg font-bold text-primary">{row.staff_name || 'System'}</p>
                          <p className="text-[11px] sm:text-xs text-soft-slate">{row.staff_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-10 py-4 sm:py-8">
                       <span className="font-black text-primary text-base sm:text-xl">{row.total_bookings}</span>
                       <span className="text-soft-slate ml-2 text-xs font-bold font-mono">confirmed</span>
                    </td>
                    <td className="px-4 sm:px-10 py-4 sm:py-8">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-elegant-gold" />
                        <p className="text-base sm:text-2xl font-black text-primary tracking-tighter">
                          {Number(row.total_revenue).toLocaleString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 sm:px-10 py-4 sm:py-8 text-right">
                       <div className="inline-flex items-center justify-end">
                          <div className="h-2 w-20 sm:w-32 bg-gray-100 rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-elegant-gold" 
                               style={{ width: `${(Number(row.total_revenue) / (totalRevenue || 1)) * 100}%` }}
                             />
                          </div>
                          <span className="ml-2 sm:ml-4 font-black text-primary text-xs sm:text-sm">
                            {Math.round((Number(row.total_revenue) / (totalRevenue || 1)) * 100)}%
                          </span>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffRevenueReport;
