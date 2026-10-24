import React, { useEffect, useState } from 'react';
import { 
  Download, 
  Calendar,
  Layers,
  Activity,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import { exportToCSV, exportToPDF } from '../utils/export';

interface ReportsData {
  kpis: {
    avgDailyRate: number;
    revpar: number;
    totalReservations: number;
    totalRevenue: number;
    customerCount: number;
    loyaltyRate: number;
  };
  chartHeights: number[];
}

const monthLabels = ['J','F','M','A','M','J','J','A','S','O','N','D'];

const Reports: React.FC = () => {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await api.get('/reports/analytics');
        setData(res.data);
      } catch (err) {
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleGenerateAudit = () => {
    if (!data) return;

    exportToPDF(
      'Audit Report - Drizzle Drop Inn',
      ['Metric', 'Value'],
      [
        ['Avg Daily Rate', `₹ ${data.kpis.avgDailyRate}`],
        ['RevPAR', `₹ ${data.kpis.revpar}`],
        ['Total Reservations', data.kpis.totalReservations],
        ['Total Revenue', `₹ ${data.kpis.totalRevenue.toLocaleString()}`],
        ['Total Customers', data.kpis.customerCount],
        ['Loyalty Rate', `${data.kpis.loyaltyRate}%`],
      ]
    );
    toast.success('Audit report opened — use Save as PDF in print dialog');
  };

  const handleExportCSV = () => {
    if (!data) return;
    exportToCSV(
      'analytics-report',
      ['Metric', 'Value'],
      [
        ['Avg Daily Rate', data.kpis.avgDailyRate],
        ['RevPAR', data.kpis.revpar],
        ['Total Reservations', data.kpis.totalReservations],
        ['Total Revenue', data.kpis.totalRevenue],
        ['Total Customers', data.kpis.customerCount],
        ['Loyalty Rate', `${data.kpis.loyaltyRate}%`],
      ]
    );
    toast.success('Analytics exported as CSV');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-elegant-gold" />
      </div>
    );
  }

  const kpis = [
    { label: 'Avg Daily Rate', value: `₹ ${data?.kpis.avgDailyRate || 0}`, change: 'Live' },
    { label: 'RevPAR', value: `₹ ${data?.kpis.revpar || 0}`, change: 'Live' },
    { label: 'Total Reservations', value: String(data?.kpis.totalReservations || 0), change: 'Live' },
    { label: 'Total Revenue', value: `₹ ${(data?.kpis.totalRevenue || 0).toLocaleString()}`, change: 'Live' },
  ];

  const chartHeights = data?.chartHeights || Array(12).fill(0);

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-primary tracking-tight">Analytics & Reports</h2>
          <p className="text-soft-slate text-sm sm:text-lg mt-1 sm:mt-2">Live performance metrics from your database.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
           <button 
             onClick={handleExportCSV}
             className="flex-1 sm:flex-initial justify-center flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white border border-soft-slate/20 rounded-xl font-bold text-xs sm:text-sm text-soft-slate hover:border-elegant-gold whitespace-nowrap"
           >
              <Calendar className="w-4 h-4" /> Export List
           </button>
           <button 
             onClick={handleGenerateAudit}
             className="flex-1 sm:flex-initial justify-center flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-deep-charcoal text-white rounded-xl font-bold text-xs sm:text-sm hover:scale-[1.02] transition-transform whitespace-nowrap"
           >
              <Download className="w-4 h-4" /> Generate Audit (PDF)
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
         {kpis.map((stat, i) => (
           <div key={i} className="glass-card p-4 sm:p-6 rounded-2xl">
              <p className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">{stat.label}</p>
              <div className="flex items-end justify-between mt-2">
                 <p className="text-xl sm:text-2xl font-bold text-primary">{stat.value}</p>
                 <span className="text-green-600 text-xs font-bold flex items-center">
                    <ArrowUpRight className="w-3 h-3" /> {stat.change}
                 </span>
              </div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        <div className="col-span-12 lg:col-span-9 glass-card p-5 sm:p-10 rounded-2xl sm:rounded-3xl min-h-[360px] sm:min-h-[400px] flex flex-col">
           <div className="flex justify-between items-center mb-6 sm:mb-10">
              <div>
                 <h3 className="text-primary text-base sm:text-lg font-bold border-b-2 border-elegant-gold pb-1.5 sm:pb-2 inline-block">Reservations by Month</h3>
              </div>
              <div className="flex gap-2">
                 <button className="p-2 bg-background rounded-lg text-primary"><Activity className="w-4 h-4" /></button>
                 <button className="p-2 hover:bg-background rounded-lg text-soft-slate"><Layers className="w-4 h-4" /></button>
              </div>
           </div>
           
           {data?.kpis.totalReservations === 0 ? (
             <div className="flex-1 flex items-center justify-center text-soft-slate">
               <p>No reservation data yet. Add bookings to see the chart.</p>
             </div>
           ) : (
             <div className="flex-1 flex items-end gap-2 sm:gap-4 px-2 sm:px-4 border-t border-border-subtle pt-8 sm:pt-10 pb-6">
                {chartHeights.map((h, i) => (
                   <div key={i} className="flex-1 group relative">
                      <div 
                        className="w-full bg-elegant-gold/20 rounded-t-lg group-hover:bg-elegant-gold transition-all duration-500" 
                        style={{ height: `${Math.max(h, 4)}%`, minHeight: '4px' }}
                      />
                      <div className="absolute -bottom-6 left-0 w-full text-center text-[9px] sm:text-[10px] text-soft-slate font-bold">
                         {monthLabels[i]}
                      </div>
                   </div>
                ))}
             </div>
           )}
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-4 sm:space-y-6">
           <div className="glass-card p-5 sm:p-8 rounded-2xl">
              <h3 className="font-bold text-primary mb-4 sm:mb-6">Database Summary</h3>
              <div className="space-y-4 sm:space-y-6">
                 <div>
                    <div className="flex justify-between text-xs mb-2">
                       <span className="text-soft-slate font-medium">Customers</span>
                       <span className="text-primary font-bold">{data?.kpis.customerCount || 0}</span>
                    </div>
                    <div className="w-full h-1.5 bg-background rounded-full">
                       <div className="h-full rounded-full bg-elegant-gold" style={{ width: `${Math.min((data?.kpis.customerCount || 0) * 10, 100)}%` }} />
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-xs mb-2">
                       <span className="text-soft-slate font-medium">Reservations</span>
                       <span className="text-primary font-bold">{data?.kpis.totalReservations || 0}</span>
                    </div>
                    <div className="w-full h-1.5 bg-background rounded-full">
                       <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min((data?.kpis.totalReservations || 0) * 10, 100)}%` }} />
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-xs mb-2">
                       <span className="text-soft-slate font-medium">Loyalty Rate</span>
                       <span className="text-primary font-bold">{data?.kpis.loyaltyRate || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-background rounded-full">
                       <div className="h-full rounded-full bg-gray-400" style={{ width: `${data?.kpis.loyaltyRate || 0}%` }} />
                    </div>
                 </div>
              </div>
           </div>

           <div className="p-5 sm:p-8 rounded-2xl bg-primary text-white">
              <h3 className="font-bold mb-2">Insight</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                {(data?.kpis.totalReservations || 0) > 0
                  ? `Total revenue of ₹ ${(data?.kpis.totalRevenue || 0).toLocaleString()} from ${data?.kpis.totalReservations} reservations.`
                  : 'Start adding customers and reservations to see insights here.'}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
