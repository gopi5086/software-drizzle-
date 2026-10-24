import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  DoorOpen, 
  BookOpen, 
  CreditCard,
  Download,
  PlusCircle,
  UserPlus,
  Loader2
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { exportToPDF, timeAgo } from '../utils/export';
import LocationPickerModal from '../components/LocationPickerModal';

interface Stats {
  totalReservations: number;
  monthlyRevenue: number;
  occupancyRate: number;
  availableRooms: number;
  totalRooms: number;
  todayCheckIns: number;
}

interface Activity {
  id: number;
  guest_name: string;
  room_type: string;
  status: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalReservations: 0,
    monthlyRevenue: 0,
    occupancyRate: 0,
    availableRooms: 0,
    totalRooms: 45,
    todayCheckIns: 0,
  });
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, activityRes] = await Promise.all([
          api.get('/reports/dashboard-stats'),
          api.get('/reports/recent-activity'),
        ]);
        setStats(statsRes.data);
        setActivity(activityRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportReport = () => {
    exportToPDF(
      'Daily Report - Drizzle Drop Inn',
      ['Metric', 'Value'],
      [
        ['Total Reservations', stats.totalReservations],
        ['Monthly Revenue', `₹ ${stats.monthlyRevenue.toLocaleString()}`],
        ['Occupancy Rate', `${stats.occupancyRate}%`],
        ['Available Rooms', `${stats.availableRooms} / ${stats.totalRooms}`],
        ['Today Check-ins', stats.todayCheckIns],
      ]
    );
    toast.success('Daily report opened — use Save as PDF in print dialog');
  };

  const activityLabel = (item: Activity) => {
    if (item.status === 'Active') return `Checked-in for ${item.room_type || 'room'}`;
    if (item.status === 'Upcoming') return `Upcoming booking - ${item.room_type || 'room'}`;
    if (item.status === 'Completed') return `Completed stay - ${item.room_type || 'room'}`;
    return `${item.status} - ${item.room_type || 'room'}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-elegant-gold" />
      </div>
    );
  }

  return (<>
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-bold text-primary tracking-tight">Good morning, {user?.full_name?.split(' ')[0] || 'Admin'}</h2>
          <p className="text-soft-slate text-lg mt-2">
            You have <span className="font-bold text-primary">{stats.todayCheckIns} reservation{stats.todayCheckIns !== 1 ? 's' : ''}</span> for today's check-in.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportReport}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-soft-slate/20 rounded-xl font-bold text-sm text-soft-slate hover:border-elegant-gold hover:text-elegant-gold transition-all"
          >
            <Download className="w-4 h-4" />
            Export Daily Report
          </button>
          <button 
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-elegant-gold text-deep-charcoal rounded-xl font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-elegant-gold/10"
          >
            <PlusCircle className="w-4 h-4" />
            Quotation for Enquiry
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-8 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Total Reservations</p>
            <p className="text-3xl font-bold text-primary mt-1">{stats.totalReservations.toLocaleString()}</p>
          </div>
        </div>

        <div className="glass-card p-8 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-xl bg-elegant-gold/10 flex items-center justify-center text-elegant-gold">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Revenue (Monthly)</p>
            <p className="text-3xl font-bold text-primary mt-1">₹ {stats.monthlyRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="glass-card p-8 rounded-2xl flex items-center gap-6">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full transform -rotate-90">
              <circle className="text-gray-100" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeWidth="6" />
              <circle 
                className="text-elegant-gold transition-all duration-1000" 
                cx="40" cy="40" fill="transparent" r="34" 
                stroke="currentColor" strokeWidth="6"
                strokeDasharray="213"
                strokeDashoffset={213 - (213 * stats.occupancyRate) / 100}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{stats.occupancyRate}%</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Occupancy</p>
            <p className="text-2xl font-bold text-primary mt-1">{stats.occupancyRate > 70 ? 'High' : stats.occupancyRate > 0 ? 'Normal' : 'Empty'}</p>
          </div>
        </div>

        <div className="glass-card p-8 rounded-2xl flex flex-col justify-between">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <DoorOpen className="w-6 h-6" />
          </div>
          <div className="mt-6">
            <p className="text-[10px] font-bold text-soft-slate uppercase tracking-widest">Available Rooms</p>
            <p className="text-3xl font-bold text-primary mt-1">
              {String(stats.availableRooms).padStart(2, '0')} <span className="text-xs font-normal text-soft-slate lowercase tracking-normal">/ {stats.totalRooms} Total</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 glass-card p-8 rounded-2xl min-h-[300px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-primary">Booking Overview</h3>
              <p className="text-sm text-soft-slate">Live data from your reservations database</p>
            </div>
          </div>
          {stats.totalReservations === 0 ? (
            <div className="flex items-center justify-center h-48 text-soft-slate">
              <p>No reservations yet. Create one to see analytics here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              <div className="p-6 bg-background rounded-2xl">
                <p className="text-[10px] font-bold text-soft-slate uppercase">Total Bookings</p>
                <p className="text-2xl font-bold text-primary mt-2">{stats.totalReservations}</p>
              </div>
              <div className="p-6 bg-background rounded-2xl">
                <p className="text-[10px] font-bold text-soft-slate uppercase">Monthly Revenue</p>
                <p className="text-2xl font-bold text-elegant-gold mt-2">₹ {stats.monthlyRevenue.toLocaleString()}</p>
              </div>
              <div className="p-6 bg-background rounded-2xl">
                <p className="text-[10px] font-bold text-soft-slate uppercase">Occupancy</p>
                <p className="text-2xl font-bold text-primary mt-2 flex items-center gap-1">
                  {stats.occupancyRate}% <TrendingUp className="w-4 h-4 text-green-600" />
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 glass-card p-8 rounded-2xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-primary">Recent Activity</h3>
          </div>
          
          {activity.length === 0 ? (
            <p className="text-sm text-soft-slate text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-6">
              {activity.slice(0, 5).map((item, i) => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary z-10 relative">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    {i < Math.min(activity.length, 5) - 1 && (
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[1px] h-full bg-border-subtle" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-primary">{item.guest_name}</p>
                    <p className="text-xs text-soft-slate">{activityLabel(item)}</p>
                    <p className="text-[10px] text-soft-slate mt-1 italic">{timeAgo(item.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

    <LocationPickerModal
      isOpen={showLocationModal}
      onClose={() => setShowLocationModal(false)}
    />
  </>);
};

export default Dashboard;
