"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { format } from 'date-fns';
import { 
  ArrowLeft, Activity, User, Stethoscope, AlertTriangle, 
  CheckCircle2, XCircle, FileEdit, HelpCircle, Thermometer,
  HeartPulse, Wind, Droplets, Scale, Phone
} from 'lucide-react';

export default function CaseReviewPage() {
  const { visitId } = useParams();
  const router = useRouter();
  
  const [visit, setVisit] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionModal, setActionModal] = useState<'approve' | 'reject' | 'edit' | 'moreInfo' | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const visitRes = await apiClient.get(`/doctor/cases/${visitId}`);
        const visitData = visitRes.data.visit;
        setVisit(visitData);

        if (visitData.patientId) {
          const patientRes = await apiClient.get(`/doctor/patients/${visitData.patientId}`);
          setPatient(patientRes.data.patient);
        }
      } catch (err) {
        console.error('Failed to load case details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [visitId]);

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      let endpoint = `/doctor/cases/${visitId}/${actionModal === 'moreInfo' ? 'request-more-information' : actionModal}`;
      let payload: any = { notes };
      
      // If edit, would pass editedAssessment here. 
      // For simplicity in this demo, we'll just pass notes for all actions.
      
      await apiClient.post(endpoint, payload);
      alert(`Successfully marked as ${actionModal}`);
      router.push('/cases');
    } catch (err) {
      console.error(err);
      alert('Action failed. Check console.');
    } finally {
      setActionLoading(false);
      setActionModal(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[#64748B]">Loading case details...</div>;
  }

  if (!visit) {
    return <div className="p-8 text-center text-[#DC2626]">Case not found.</div>;
  }

  const ai = visit.aiAssessment;
  const vitals = visit.vitals || {};

  return (
    <div className="max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-[#E2E8F0] rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-[#1E293B]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Clinical Review: {visit.patientName}</h1>
          <p className="text-[#64748B] text-sm">
            Visit ID: {visitId} • {visit.timestamp ? format(new Date(visit.timestamp._seconds * 1000), 'MMM d, yyyy h:mm a') : ''}
          </p>
        </div>
        
        {visit.status === 'reviewed' && (
          <div className="ml-auto flex items-center gap-2 bg-[#F0FDF4] text-[#16A34A] px-4 py-2 rounded-lg border border-[#bbf7d0]">
            <CheckCircle2 size={18} />
            <span className="font-semibold">Already Reviewed</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT PANE: Patient Data */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-6">
            <h2 className="text-lg font-bold text-[#1E293B] mb-4 flex items-center gap-2">
              <User size={20} className="text-[#0E7490]" />
              Patient Profile
            </h2>
            {patient ? (
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-[#64748B]">Age / Gender</p><p className="font-medium text-[#1E293B]">{patient.age} / {patient.gender}</p></div>
                <div><p className="text-xs text-[#64748B]">Phone</p><p className="font-medium text-[#1E293B] flex items-center gap-1"><Phone size={14}/>{patient.phoneNumber}</p></div>
                <div className="col-span-2"><p className="text-xs text-[#64748B]">History</p><p className="font-medium text-[#1E293B]">{patient.medicalHistory || 'None'}</p></div>
              </div>
            ) : (
              <p className="text-sm text-[#64748B]">No patient profile linked.</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-6">
            <h2 className="text-lg font-bold text-[#1E293B] mb-4 flex items-center gap-2">
              <Stethoscope size={20} className="text-[#0E7490]" />
              Current Symptoms
            </h2>
            <div className="space-y-3">
              <div><p className="text-xs text-[#64748B]">Primary Symptoms</p><p className="font-medium text-[#1E293B]">{visit.symptoms || 'N/A'}</p></div>
              <div><p className="text-xs text-[#64748B]">Duration</p><p className="font-medium text-[#1E293B]">{visit.duration || 'N/A'}</p></div>
              {visit.additionalNotes && (
                <div><p className="text-xs text-[#64748B]">Additional Notes</p><p className="text-sm text-[#1E293B] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] mt-1">{visit.additionalNotes}</p></div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-6">
            <h2 className="text-lg font-bold text-[#1E293B] mb-4 flex items-center gap-2">
              <Activity size={20} className="text-[#0E7490]" />
              Vitals
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#FFF7ED] p-3 rounded-lg"><p className="text-xs text-[#EA580C] flex items-center gap-1"><Thermometer size={14}/> Temp</p><p className="font-bold text-[#1E293B]">{vitals.temperature || '-'} °C</p></div>
              <div className="bg-[#FEF2F2] p-3 rounded-lg"><p className="text-xs text-[#DC2626] flex items-center gap-1"><HeartPulse size={14}/> BP</p><p className="font-bold text-[#1E293B]">{vitals.bloodPressure || '-'} mmHg</p></div>
              <div className="bg-[#FEF2F2] p-3 rounded-lg"><p className="text-xs text-[#DC2626] flex items-center gap-1"><HeartPulse size={14}/> HR</p><p className="font-bold text-[#1E293B]">{vitals.heartRate || '-'} bpm</p></div>
              <div className="bg-[#E0F2FE] p-3 rounded-lg"><p className="text-xs text-[#0E7490] flex items-center gap-1"><Droplets size={14}/> SpO2</p><p className="font-bold text-[#1E293B]">{vitals.spO2 || '-'} %</p></div>
              <div className="bg-[#F3E8FF] p-3 rounded-lg"><p className="text-xs text-[#9333EA] flex items-center gap-1"><Wind size={14}/> Resp</p><p className="font-bold text-[#1E293B]">{vitals.respiratoryRate || '-'} /min</p></div>
              <div className="bg-[#FEF3C7] p-3 rounded-lg"><p className="text-xs text-[#D97706] flex items-center gap-1"><Scale size={14}/> Weight</p><p className="font-bold text-[#1E293B]">{vitals.weight || '-'} kg</p></div>
            </div>
          </div>

          {(visit.images?.length > 0 || visit.finalTranscript) && (
            <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-6">
              <h2 className="text-lg font-bold text-[#1E293B] mb-4">Media & Attachments</h2>
              
              {visit.finalTranscript && (
                <div className="mb-4">
                  <p className="text-xs text-[#64748B] mb-1">Voice Transcript</p>
                  <p className="text-sm text-[#1E293B] bg-[#F8FAFC] p-3 rounded-lg italic border border-[#E2E8F0]">"{visit.finalTranscript}"</p>
                </div>
              )}

              {visit.images?.length > 0 && (
                <div>
                  <p className="text-xs text-[#64748B] mb-2">Uploaded Images</p>
                  <div className="flex gap-2 overflow-x-auto">
                    {visit.images.map((img: string, i: number) => (
                      <div key={i} className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {/* Note: In real app, need a signed URL if bucket is private */}
                        <img src={`https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(img)}?alt=media`} alt="Clinical view" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANE: AI Assessment */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
            <div className={`p-4 border-b ${ai?.riskLevel === 'emergency' || ai?.riskLevel === 'high' ? 'bg-[#FEF2F2] border-[#FCA5A5]' : 'bg-[#F0FDF4] border-[#BBF7D0]'}`}>
              <h2 className={`text-lg font-bold flex items-center gap-2 ${ai?.riskLevel === 'emergency' || ai?.riskLevel === 'high' ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
                {ai?.riskLevel === 'emergency' || ai?.riskLevel === 'high' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                AI Triage: {ai?.riskLevel?.toUpperCase()} RISK
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {ai?.redFlags?.length > 0 && (
                <div className="bg-[#FEF2F2] border border-[#FCA5A5] p-4 rounded-lg">
                  <h3 className="text-sm font-bold text-[#DC2626] mb-2 flex items-center gap-1"><AlertTriangle size={16}/> RED FLAGS</h3>
                  <ul className="list-disc pl-5 text-sm text-[#DC2626] space-y-1">
                    {ai.redFlags.map((rf: string, i: number) => <li key={i}>{rf}</li>)}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-[#1E293B] mb-3 border-b border-[#E2E8F0] pb-2">Differential Possibilities</h3>
                <div className="space-y-4">
                  {ai?.possibleConditions?.map((c: any, i: number) => (
                    <div key={i} className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-[#0E7490]">{c.condition || c.name}</span>
                        {c.probability && <span className="text-xs bg-white border border-[#E2E8F0] px-2 py-1 rounded">{c.probability}</span>}
                      </div>
                      <p className="text-sm text-[#64748B] mb-2">{c.reasoning}</p>
                      <div className="flex flex-wrap gap-1">
                        {c.supportingFindings?.map((f: string, j: number) => (
                          <span key={j} className="text-[10px] bg-[#E0F2FE] text-[#0E7490] px-2 py-1 rounded-full">{f}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {ai?.trendAssessment && (
                <div>
                  <h3 className="text-sm font-bold text-[#1E293B] mb-3 border-b border-[#E2E8F0] pb-2">Clinical Trend</h3>
                  <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                    <p className="font-medium text-[#1E293B] capitalize mb-1">{ai.trendAssessment.status}</p>
                    {ai.trendAssessment.clinicalChanges && <p className="text-sm text-[#64748B]">{ai.trendAssessment.clinicalChanges}</p>}
                    {ai.trendAssessment.actionableAdvice && <p className="text-sm text-[#0E7490] mt-2 font-medium">{ai.trendAssessment.actionableAdvice}</p>}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-[#1E293B] mb-3 border-b border-[#E2E8F0] pb-2">Recommended Next Steps</h3>
                <ul className="space-y-2">
                  {ai?.nextSteps?.map((ns: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#1E293B]">
                      <CheckCircle2 size={16} className="text-[#16A34A] flex-shrink-0 mt-0.5" />
                      <span>{ns}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Action Bar (Sticky Bottom) */}
      {visit.status !== 'reviewed' && (
        <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-[#E2E8F0] p-4 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <button onClick={() => setActionModal('moreInfo')} className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]">
            <HelpCircle size={18} /> Ask Health Worker
          </button>
          {/* <button onClick={() => setActionModal('edit')} className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold border border-[#0E7490] text-[#0E7490] hover:bg-[#E0F2FE]">
            <FileEdit size={18} /> Edit Plan
          </button> */}
          <button onClick={() => setActionModal('reject')} className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] hover:bg-[#FEE2E2]">
            <XCircle size={18} /> Reject
          </button>
          <button onClick={() => setActionModal('approve')} className="flex items-center gap-2 px-8 py-3 rounded-lg font-semibold bg-[#16A34A] text-white hover:bg-[#15803D]">
            <CheckCircle2 size={18} /> Approve Treatment
          </button>
        </div>
      )}

      {/* Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-[#0F172A]/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
              <h3 className="font-bold text-lg text-[#1E293B] capitalize">{actionModal === 'moreInfo' ? 'Request Information' : actionModal} AI Assessment</h3>
              <button onClick={() => setActionModal(null)} className="text-[#64748B] hover:text-[#1E293B]">
                <XCircle size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-[#64748B] mb-4">
                Please provide notes for the health worker. These notes will be attached to the final record.
              </p>
              <textarea
                className="w-full border border-[#E2E8F0] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#0E7490] outline-none min-h-[120px]"
                placeholder="Enter your clinical instructions or reasons..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end gap-3">
              <button disabled={actionLoading} onClick={() => setActionModal(null)} className="px-4 py-2 font-medium text-[#64748B] hover:text-[#1E293B]">Cancel</button>
              <button 
                disabled={actionLoading}
                onClick={handleAction} 
                className={`px-6 py-2 rounded-lg font-semibold text-white ${
                  actionModal === 'approve' ? 'bg-[#16A34A] hover:bg-[#15803D]' : 
                  actionModal === 'reject' ? 'bg-[#DC2626] hover:bg-[#B91C1C]' : 
                  'bg-[#0E7490] hover:bg-[#164E63]'
                } disabled:opacity-50`}
              >
                {actionLoading ? 'Saving...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
