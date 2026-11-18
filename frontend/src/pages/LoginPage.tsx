import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import api from '../api/axios';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [slowServerHint, setSlowServerHint] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSlowServerHint(false);

    // If request takes longer than 3.5s (e.g. Render spin-up), inform the user
    const timer = setTimeout(() => {
      setSlowServerHint(true);
    }, 3500);

    try {
      const res = await api.post('/auth/login', { email: email.trim(), password });
      clearTimeout(timer);
      setSlowServerHint(false);
      login(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.full_name}!`);
      navigate('/dashboard');
    } catch (err: any) {
      clearTimeout(timer);
      setSlowServerHint(false);
      
      const serverMessage = err.response?.data?.message;
      let errorMsg = 'Invalid credentials or server error';

      if (serverMessage) {
        errorMsg = serverMessage;
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMsg = 'Server response timed out. Render backend may still be waking up. Please try again.';
      } else if (err.message === 'Network Error' || !err.response) {
        errorMsg = 'Cannot reach backend server. Please verify Render backend is active and VITE_API_URL is configured on Vercel.';
      }

      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-deep-charcoal flex items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center">
      <div className="absolute inset-0 bg-deep-charcoal/80" />

      <div className="relative w-full max-w-lg">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 p-12 rounded-[2.5rem] shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="mb-6 bg-white rounded-2xl px-5 py-4 shadow-xl shadow-black/30">
              <img src="/logo.png" alt="DrizzleDrop Inn" className="h-20 w-auto object-contain" />
            </div>
            <h1 className="text-4xl font-bold text-white text-center">Welcome Back</h1>
            <p className="text-elegant-gold/60 text-sm mt-2 uppercase tracking-[0.3em] font-bold">Drizzle Drop Inn</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin12@gmail.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-elegant-gold transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest pl-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-elegant-gold transition-all"
                  required
                />
              </div>
            </div>

            {slowServerHint && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs animate-pulse">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Waking up cloud server (Render free tier may take ~30–50s)...</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-elegant-gold text-deep-charcoal font-bold py-5 rounded-2xl shadow-xl shadow-elegant-gold/20 hover:scale-[1.02] transition-transform active:scale-100 mt-4 text-lg flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-deep-charcoal" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>

          <p className="text-center text-white/30 text-xs mt-10">
            Internal Access Only • Authorized Staff Only
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
