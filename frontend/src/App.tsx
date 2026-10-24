import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Reservations from './pages/Reservations';
import Customers from './pages/Customers';
import Staff from './pages/Staff';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import CreateReservationPage from './pages/CreateReservationPage';
import ReservationReceiptPage from './pages/ReservationReceiptPage';
import StaffRevenueReport from './pages/StaffRevenueReport';
import GuestLookupPage from './pages/GuestLookupPage';
import ChennaiEnquiryPage from './pages/ChennaiEnquiryPage';
import OotyEnquiryPage from './pages/OotyEnquiryPage';
import RecordPage from './pages/RecordPage';
import EnquiriesPage from './pages/EnquiriesPage';
import Invoices from './pages/Invoices';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" theme="dark" richColors />
        <Routes>
          <Route path="/" element={<LoginPage />} />
          
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/enquiries" element={<EnquiriesPage />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/record" element={<RecordPage />} />
            <Route path="/guest-lookup" element={<GuestLookupPage />} />

            <Route path="/create-reservation" element={<CreateReservationPage />} />
            <Route path="/edit-reservation/:id" element={<CreateReservationPage />} />
            <Route path="/create-chennai-enquiry" element={<ChennaiEnquiryPage />} />
            <Route path="/create-ooty-enquiry" element={<OotyEnquiryPage />} />
            <Route path="/reservation-receipt" element={<ReservationReceiptPage />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/staff-revenue" element={<StaffRevenueReport />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
