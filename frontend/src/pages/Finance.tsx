import React, { useEffect, useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign,
  History,
  TrendingUp,
  PieChart,
  Loader2,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../api/axios';
import { exportToCSV, exportToPDF, formatDate } from '../utils/export';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  status: string;
  date: string;
  user: string;
}

interface FinanceData {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  pendingAmount: number;
  transactions: Transaction[];
}

const Finance: React.FC = () => {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinance = async () => {
      setLoading(true);
      try {
        const res = await api.get('/reports/finance');
        setData(res.data);
      } catch (err: any) {
        toast.error('Failed to load finance data');
      } finally {
        setLoading(false);
      }
    };
    fetchFinance();
  }, []);

  const handleExportCSV = () => {
    if (!data?.transactions.length) {
      toast.error('No transactions to export');
      return;
    }
    exportToCSV(
      'finance-transactions',
      ['Source', 'Date', 'Status', 'Amount'],
      data.transactions.map((tx) => [
        tx.user, formatDate(tx.date), tx.status, tx.amount,
      ])
    );
    toast.success('Transactions exported as CSV');
  };

  const handleExportPDF = () => {
    if (!data) return;
    exportToPDF(
      'Finance Overview - Drizzle Drop Inn',
      ['Metric', 'Amount'],
      [
        ['Current Balance', `₹ ${data.currentBalance.toLocaleString()}`],
        ['Monthly Income', `₹ ${data.monthlyIncome.toLocaleString()}`],
        ['Pending Amount', `₹ ${data.pendingAmount.toLocaleString()}`],
        ...data.transactions.slice(0, 15).map((tx) => [
          tx.user, `₹ ${tx.amount} (${tx.status})`,
        ]),
      ]
    );
    toast.success('PDF export opened — use Save as PDF in print dialog');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-elegant-gold" />
      </div>
    );
  }

  const transactions = data?.transactions || [];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-5xl font-bold text-primary tracking-tight">Finance Overview</h2>
          <p className="text-soft-slate text-lg mt-2">Manage your hotel's revenue from reservations.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-soft-slate/20 rounded-xl font-bold text-sm text-soft-slate hover:border-elegant-gold transition-all"
          >
            <Download className="w-4 h-4" /> Export List
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-soft-slate/20 rounded-xl font-bold text-sm text-soft-slate hover:border-elegant-gold transition-all"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-deep-charcoal p-8 rounded-3xl text-white relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-elegant-gold text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Total Collected</p>
            <h3 className="text-4xl font-bold">₹ {(data?.currentBalance || 0).toLocaleString()}</h3>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-32 h-32" />
          </div>
        </div>

        <div className="glass-card p-8 rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
             <div className="p-3 bg-green-50 rounded-xl text-green-600">
                <ArrowUpRight className="w-6 h-6" />
             </div>
          </div>
          <div>
            <p className="text-soft-slate text-[10px] font-bold uppercase tracking-widest">Monthly Income</p>
            <p className="text-3xl font-bold text-primary mt-1">₹ {(data?.monthlyIncome || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="glass-card p-8 rounded-3xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
             <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600">
                <ArrowDownRight className="w-6 h-6" />
             </div>
          </div>
          <div>
            <p className="text-soft-slate text-[10px] font-bold uppercase tracking-widest">Pending Collection</p>
            <p className="text-3xl font-bold text-primary mt-1">₹ {(data?.pendingAmount || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 glass-card rounded-2xl overflow-hidden">
          <div className="p-8 border-b border-border-subtle flex justify-between items-center">
            <h3 className="text-xl font-bold text-primary">Recent Transactions</h3>
            <button 
              onClick={handleExportCSV}
              className="text-xs font-bold text-elegant-gold flex items-center gap-2"
            >
              <History className="w-4 h-4" /> Export History
            </button>
          </div>
          {transactions.length === 0 ? (
            <div className="text-center py-16 text-soft-slate">
              <p>No transactions yet. Create reservations to see revenue here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-background text-soft-slate text-[10px] font-bold uppercase tracking-widest border-b border-border-subtle">
                    <th className="px-8 py-4 text-left">Source</th>
                    <th className="px-8 py-4 text-left">Date</th>
                    <th className="px-8 py-4 text-left">Status</th>
                    <th className="px-8 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-background/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-50 text-green-600">
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-primary">{tx.user}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-soft-slate">{formatDate(tx.date)}</td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          tx.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right font-bold text-sm text-green-600">
                        +₹ {tx.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
           <div className="glass-card p-8 rounded-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-primary">Revenue Split</h3>
                <PieChart className="w-5 h-5 text-elegant-gold" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-elegant-gold" />
                     <span className="text-xs text-soft-slate">Room Booking</span>
                   </div>
                   <span className="text-xs font-bold text-primary">100%</span>
                </div>
                <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                   <div className="h-full bg-elegant-gold" style={{ width: '100%' }} />
                </div>
              </div>
           </div>

           <div className="glass-card p-8 rounded-2xl bg-elegant-gold/5 border-elegant-gold/20">
              <div className="flex items-center gap-3 mb-4">
                 <TrendingUp className="w-6 h-6 text-elegant-gold" />
                 <h3 className="font-bold text-primary">Summary</h3>
              </div>
              <p className="text-sm text-soft-slate leading-relaxed">
                {transactions.length > 0
                  ? `You have ${transactions.length} reservation${transactions.length !== 1 ? 's' : ''} recorded with ₹ ${(data?.monthlyIncome || 0).toLocaleString()} collected this month.`
                  : 'Add reservations to start tracking your hotel revenue.'}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
