"use client";

import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Stethoscope } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auto-redirect is handled by AuthContext
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-[#E2E8F0]">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#0E7490] rounded-full flex items-center justify-center mb-4">
            <Stethoscope size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B]">VirtualCare</h1>
          <p className="text-[#64748B]">Doctor Web Portal</p>
        </div>

        {error && (
          <div className="bg-[#FEF2F2] border border-[#DC2626] text-[#DC2626] px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">Doctor Email</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0E7490] focus:border-transparent outline-none"
              placeholder="doctor@clinic.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-2">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-2 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#0E7490] focus:border-transparent outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#0E7490] text-white py-3 rounded-lg font-semibold hover:bg-[#164E63] transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <p className="text-center text-[#64748B] text-xs mt-8">
          Authorized personnel only. Access is monitored.
        </p>
      </div>
    </div>
  );
}
