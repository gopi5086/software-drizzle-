import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  CreditCard, 
  MoreVertical,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import api from '../api/axios';
import { exportToCSV, formatDate } from '../utils/export';
import UnifiedInvoice, { type UnifiedInvoiceData } from '../components/UnifiedInvoice';

interface Invoice {
  id: string;
  reservationId: number;
  client: string;
  date: string;
  amount: number;
  advance: number;
  status: string;
  method: string;
}

interface InvoiceSummary {
  totalCollected: number;
  pendingPayment: number;
  overdue: number;
  totalInvoices: number;
}

const PAGE_SIZE = 10;

const Invoices: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary>({
    totalCollected: 0, pendingPayment: 0, overdue: 0, totalInvoices: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [printData, setPrintData] = useState<UnifiedInvoiceData | null>(null);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  useEffect(() => {
    if (isPreparingPrint && printData) {
      const timer = setTimeout(() => {
        window.print();
        setIsPreparingPrint(false);
        setPrintData(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isPreparingPrint, printData]);

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const res = await api.get('/reports/invoices');
        setInvoices(res.data.invoices);
        setSummary(res.data.summary);
      } catch (err) {
        toast.error('Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const filtered = invoices.filter(
    (inv) => {
      const matchSearch = inv.id.toLowerCase().includes(search.toLowerCase()) ||
                          inv.client.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' ? true : inv.status === statusFilter;
      return matchSearch && matchStatus;
    }
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleExportCSV = () => {
    if (invoices.length === 0) {
      toast.error('No invoices to export');
      return;
    }
    exportToCSV(
      'invoices',
      ['Invoice ID', 'Customer', 'Date', 'Amount', 'Status', 'Method'],
      invoices.map((inv) => [
        inv.id, inv.client, formatDate(inv.date), inv.amount, inv.status, inv.method,
      ])
    );
    toast.success('Invoice list exported as CSV');
  };

  const handleAction = async (inv: Invoice) => {
    const toastId = toast.loading('Preparing high-fidelity invoice...');
    try {
      const res = await api.get(`/reservations/${inv.reservationId}`);
      const data = res.data;
      
      const parseRooms = (jsonStr?: string) => {
        try { return jsonStr ? JSON.parse(jsonStr) : []; } catch { return []; }
      };

      const unifiedData: UnifiedInvoiceData = {
        guestName: data.guest_name,
        guestEmail: data.guest_email,
        guestPhone: data.guest_phone,
        checkIn: data.check_in,
        checkOut: data.check_out,
        adults: data.adults,
        children: data.children,
        numRooms: data.num_rooms,
        roomType: data.room_type,
        rooms: parseRooms(data.room_details),
        specialRequirements: data.special_requirements,
        specialRequirementsAmount: Number(data.special_requirements_amount || 0),
        earlyCheckinAmount: Number(data.early_checkin_amount || 0),
        lateCheckoutAmount: Number(data.late_checkout_amount || 0),
        stayCosyAmount: Number(data.stay_cosy_amount || 0),
        totalTariff: Number(data.total_tariff),
        advance: Number(data.advance),
        balanceDue: Number(data.total_tariff) - Number(data.advance),
        checkInTime: data.check_in_time,
        checkOutTime: data.check_out_time,
      };

      setPrintData(unifiedData);
      setIsPreparingPrint(true);
      toast.success('Ready to print/download', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch full reservation data', { id: toastId });
    }
  };

  const handleExportInvoicePDF = (inv: Invoice) => {
    handleAction(inv);
  };

  const handlePrintInvoice = (inv: Invoice) => {
    handleAction(inv);
  };

  const handleSummaryPDF = () => {
    exportToPDF(
      'Monthly Billing Summary - Drizzle Drop Inn',
      ['Metric', 'Amount'],
      [
        ['Total Invoices', summary.totalInvoices],
        ['Total Collected', `₹ ${summary.totalCollected.toLocaleString()}`],
        ['Pending Payment', `₹ ${summary.pendingPayment.toLocaleString()}`],
        ['Overdue', `₹ ${summary.overdue.toLocaleString()}`],
      ]
    );
    toast.success('Summary PDF opened — use Save as PDF in print dialog');
    setIsSummaryOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-elegant-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-5xl font-bold text-primary tracking-tight">Billing & Invoices</h2>
          <p className="text-soft-slate text-lg mt-2">Track revenue collection from reservations.</p>
        </div>
        <div className="flex gap-4">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-slate w-4 h-4" />
              <input 
                type="text" 
                placeholder="Find invoice #..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="bg-white border border-border-subtle rounded-xl py-3 pl-12 pr-6 text-sm focus:ring-2 focus:ring-elegant-gold transition-all"
              />
           </div>
           <button
             onClick={handleExportCSV}
             className="flex items-center gap-2 px-6 py-3 bg-white border border-border-subtle rounded-xl font-bold text-sm text-soft-slate hover:border-elegant-gold"
           >
             <Download className="w-5 h-5" />
             Export List
           </button>
           <button 
             onClick={() => setIsSummaryOpen(true)}
             className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm"
           >
             <FileText className="w-5 h-5" />
             Monthly Summary
           </button>
        </div>
      </header>

      {/* Status Filter Tabs */}
      <div className="flex gap-6 border-b border-border-subtle overflow-x-auto scrollbar-hide">
        {['All', 'Paid', 'Pending', 'Overdue'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setStatusFilter(tab); setCurrentPage(1); }}
            className={`pb-4 text-sm font-bold transition-all ${
              statusFilter === tab
                ? 'text-primary border-b-2 border-elegant-gold'
                : 'text-soft-slate hover:text-primary'
            }`}
          >
            {tab}
            <span className="ml-2 text-[10px] bg-background rounded-full px-2 py-0.5">
              {tab === 'All' ? invoices.length : invoices.filter(inv => inv.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="glass-card p-8 rounded-3xl">
            <CheckCircle2 className="w-8 h-8 text-green-600 mb-4" />
            <p className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Total Collected</p>
            <p className="text-3xl font-bold text-primary mt-1">₹ {summary.totalCollected.toLocaleString()}</p>
         </div>
         <div className="glass-card p-8 rounded-3xl">
            <Clock className="w-8 h-8 text-yellow-600 mb-4" />
            <p className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Pending Payment</p>
            <p className="text-3xl font-bold text-primary mt-1">₹ {summary.pendingPayment.toLocaleString()}</p>
         </div>
         <div className="glass-card p-8 rounded-3xl border-red-100">
            <AlertCircle className="w-8 h-8 text-red-600 mb-4" />
            <p className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Overdue</p>
            <p className="text-3xl font-bold text-red-600 mt-1">₹ {summary.overdue.toLocaleString()}</p>
         </div>
         <div className="glass-card p-8 rounded-3xl bg-primary text-white">
            <CreditCard className="w-8 h-8 text-elegant-gold mb-4" />
            <p className="text-[10px] font-bold text-elegant-gold uppercase tracking-widest">Total Invoices</p>
            <p className="text-3xl font-bold mt-1">{summary.totalInvoices}</p>
         </div>
      </div>

      <div className="glass-card rounded-[2.5rem] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-soft-slate">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-bold text-primary">No invoices yet</p>
            <p className="text-sm mt-1">Invoices are generated from reservations automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-background text-soft-slate text-[10px] font-bold uppercase tracking-widest border-b border-border-subtle">
                  <th className="px-8 py-6 text-left">Invoice ID</th>
                  <th className="px-8 py-6 text-left">Customer</th>
                  <th className="px-8 py-6 text-left">Billing Date</th>
                  <th className="px-8 py-6 text-left">Amount</th>
                  <th className="px-8 py-6 text-left">Payment Status</th>
                  <th className="px-8 py-6 text-left">Method</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {paginated.map((inv) => (
                  <tr key={inv.id} className="hover:bg-background/20 transition-colors group">
                    <td className="px-8 py-8">
                       <span className="text-xs font-bold font-mono px-3 py-1 bg-background rounded-lg border border-border-subtle">
                          {inv.id}
                       </span>
                    </td>
                    <td className="px-8 py-8">
                       <p className="text-sm font-bold text-primary">{inv.client}</p>
                    </td>
                    <td className="px-8 py-8">
                       <div className="flex items-center gap-2 text-xs text-soft-slate font-medium">
                          <Clock className="w-4 h-4" /> {formatDate(inv.date)}
                       </div>
                    </td>
                    <td className="px-8 py-8">
                       <p className="text-sm font-bold text-primary">₹ {inv.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-8">
                       <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.status === 'Paid' ? 'bg-green-50 text-green-600' : 
                          inv.status === 'Pending' ? 'bg-yellow-50 text-yellow-600' : 
                          'bg-red-50 text-red-600'
                       }`}>
                          {inv.status}
                       </span>
                    </td>
                    <td className="px-8 py-8">
                       <div className="flex items-center gap-2 text-xs text-soft-slate font-bold">
                          <CreditCard className="w-4 h-4" /> {inv.method}
                       </div>
                    </td>
                    <td className="px-8 py-8 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button
                           onClick={() => handlePrintInvoice(inv)}
                           className="p-2 text-soft-slate hover:text-primary hover:bg-background rounded-lg transition-all"
                           title="Print"
                         >
                           <Printer className="w-4 h-4" />
                         </button>
                         <button
                           onClick={() => handleExportInvoicePDF(inv)}
                           className="p-2 text-soft-slate hover:text-primary hover:bg-background rounded-lg transition-all"
                           title="Download PDF"
                         >
                           <Download className="w-4 h-4" />
                         </button>
                         <button className="p-2 text-soft-slate hover:text-primary hover:bg-background rounded-lg transition-all" title="More">
                           <MoreVertical className="w-4 h-4" />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="p-10 bg-background/50 border-t border-border-subtle flex justify-between items-center">
             <div className="text-sm text-soft-slate">
                Showing <span className="font-bold text-primary">{(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filtered.length)}</span> of <span className="font-bold text-primary">{filtered.length}</span> Invoices
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-2 border border-border-subtle rounded-xl text-xs font-bold text-soft-slate hover:bg-white hover:text-primary transition-all disabled:opacity-30"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-6 py-2 border border-border-subtle rounded-xl text-xs font-bold text-primary bg-white shadow-sm hover:bg-background transition-all disabled:opacity-30"
                >
                  Next
                </button>
             </div>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isSummaryOpen} 
        onClose={() => setIsSummaryOpen(false)} 
        title="Monthly Billing Summary"
      >
        <div className="space-y-6">
           <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-background rounded-2xl border border-border-subtle">
                 <p className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Invoices Issued</p>
                 <p className="text-2xl font-bold text-primary mt-1">{summary.totalInvoices}</p>
              </div>
              <div className="p-6 bg-background rounded-2xl border border-border-subtle">
                 <p className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Net Revenue</p>
                 <p className="text-2xl font-bold text-green-600 mt-1">₹ {summary.totalCollected.toLocaleString()}</p>
              </div>
           </div>

           <button 
             onClick={handleSummaryPDF}
             className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
           >
             Download Full PDF Report
           </button>
        </div>
      </Modal>

      {/* Hidden high-fidelity invoice for printing */}
      <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-[9999]">
         {printData && <UnifiedInvoice data={printData} />}
      </div>
    </div>
  );
};

export default Invoices;
