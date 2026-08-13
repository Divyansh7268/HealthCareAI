"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { format } from 'date-fns';
import { AlertCircle, Filter, ChevronRight, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await apiClient.get('/doctor/cases');
        setCases(res.data.cases || []);
      } catch (err) {
        console.error('Failed to load cases', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const filteredCases = cases.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'pending') return c.status === 'pending';
    if (filter === 'reviewed') return c.status === 'reviewed';
    if (filter === 'approved') return c.doctorAction?.action === 'approved';
    if (filter === 'rejected') return c.doctorAction?.action === 'rejected';
    
    // Risk level filters
    if (['emergency', 'high', 'moderate', 'low'].includes(filter)) {
      return c.aiAssessment?.riskLevel === filter;
    }
    
    return true;
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'emergency': return 'bg-[#DC2626] text-white';
      case 'high': return 'bg-[#EA580C] text-white';
      case 'moderate': return 'bg-[#D97706] text-white';
      case 'low': return 'bg-[#16A34A] text-white';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (visit: any) => {
    if (visit.status === 'pending') return <Clock className="text-[#D97706]" size={18} />;
    if (visit.doctorAction?.action === 'approved') return <CheckCircle2 className="text-[#16A34A]" size={18} />;
    if (visit.doctorAction?.action === 'rejected') return <XCircle className="text-[#DC2626]" size={18} />;
    return <CheckCircle2 className="text-[#64748B]" size={18} />;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1E293B]">All Cases</h1>
          <p className="text-[#64748B] mt-1">Review AI assessments and triage patients</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-[#64748B]" />
          <select 
            className="border border-[#E2E8F0] rounded-lg px-4 py-2 bg-white outline-none focus:ring-2 focus:ring-[#0E7490]"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Cases</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <optgroup label="Risk Level">
              <option value="emergency">Emergency Risk</option>
              <option value="high">High Risk</option>
              <option value="moderate">Moderate Risk</option>
              <option value="low">Low Risk</option>
            </optgroup>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#64748B]">Loading cases...</div>
        ) : filteredCases.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#E2E8F0]">
              <CheckCircle2 className="text-[#64748B]" size={32} />
            </div>
            <h3 className="text-lg font-medium text-[#1E293B]">No Cases Found</h3>
            <p className="text-[#64748B] mt-1">There are no cases matching the current filter.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="px-6 py-4 text-sm font-semibold text-[#64748B]">Patient & Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#64748B]">Risk Level</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#64748B]">Possible Condition</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#64748B]">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#64748B] text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((c) => (
                <tr key={c.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-medium text-[#1E293B]">{c.patientName || 'Unknown Patient'}</p>
                    <p className="text-xs text-[#64748B] mt-1">
                      {c.timestamp ? format(new Date(c.timestamp._seconds * 1000), 'MMM d, yyyy h:mm a') : 'Unknown time'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getRiskColor(c.aiAssessment?.riskLevel)}`}>
                      {c.aiAssessment?.riskLevel || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#1E293B] truncate max-w-[200px]">
                      {c.aiAssessment?.possibleConditions?.[0]?.condition || 'Analysis pending'}
                    </p>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    {getStatusIcon(c)}
                    <span className="text-sm text-[#1E293B] capitalize">
                      {c.doctorAction?.action || c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/cases/${c.id}`}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-white border border-[#E2E8F0] text-[#0E7490] hover:bg-[#E0F2FE] hover:border-[#0E7490] transition-colors"
                    >
                      <span className="text-sm font-medium mr-1">Review</span>
                      <ChevronRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
