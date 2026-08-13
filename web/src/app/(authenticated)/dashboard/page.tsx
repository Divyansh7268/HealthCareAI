"use client";

import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import apiClient from '@/lib/apiClient';

interface DashboardStats {
  pendingQueries: number;
  highRiskCases: number;
  emergencyCases: number;
  todayPatientCount: number;
  completedConsultations: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would be a dedicated /dashboard/stats endpoint.
    // For now, we simulate fetching stats from /cases endpoint.
    const fetchStats = async () => {
      try {
        const res = await apiClient.get('/doctor/cases');
        const cases = res.data.cases || [];
        
        // Compute mock stats from cases list
        const pending = cases.filter((c: any) => c.doctorReviewStatus === 'review_required').length;
        const highRisk = cases.filter((c: any) => c.riskLevel === 'high').length;
        const emergency = cases.filter((c: any) => c.riskLevel === 'emergency').length;
        const completed = cases.filter((c: any) => c.doctorReviewStatus === 'reviewed' || c.doctorReviewStatus === 'approved').length;

        setStats({
          pendingQueries: pending,
          highRiskCases: highRisk,
          emergencyCases: emergency,
          todayPatientCount: cases.length,
          completedConsultations: completed
        });
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E2E8F0] flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-[#64748B] mb-1">{title}</p>
        <p className="text-3xl font-bold text-[#1E293B]">
          {loading ? '-' : value}
        </p>
      </div>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgClass}`}>
        <Icon className={colorClass} size={24} />
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1E293B]">Doctor Dashboard</h1>
        <p className="text-[#64748B] mt-2">Overview of clinical assessments needing your review.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Emergency Cases" 
          value={stats?.emergencyCases} 
          icon={AlertTriangle} 
          colorClass="text-[#DC2626]" 
          bgClass="bg-[#FEF2F2]" 
        />
        <StatCard 
          title="High Risk Cases" 
          value={stats?.highRiskCases} 
          icon={Activity} 
          colorClass="text-[#EA580C]" 
          bgClass="bg-[#FFF7ED]" 
        />
        <StatCard 
          title="Pending Reviews" 
          value={stats?.pendingQueries} 
          icon={Clock} 
          colorClass="text-[#D97706]" 
          bgClass="bg-[#FEF3C7]" 
        />
        <StatCard 
          title="Completed Today" 
          value={stats?.completedConsultations} 
          icon={CheckCircle2} 
          colorClass="text-[#16A34A]" 
          bgClass="bg-[#F0FDF4]" 
        />
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-[#E2E8F0] text-center py-16">
        <div className="w-16 h-16 bg-[#E0F2FE] rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="text-[#0E7490]" size={32} />
        </div>
        <h2 className="text-xl font-bold text-[#1E293B] mb-2">Welcome to VirtualCare</h2>
        <p className="text-[#64748B] max-w-md mx-auto">
          Navigate to the Cases tab to begin reviewing AI assessments submitted by health workers. 
          Prioritize Emergency and High Risk cases.
        </p>
      </div>
    </div>
  );
}
