import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, X, FileText, Send, ArrowLeft } from 'lucide-react';

export default function PatientReview() {
  const { visitId, patientId } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Note: In a real app we'd fetch the specific visit details here using visitId
  // For this prototype, we're assuming the doctor has the context and just needs to approve/reject
  
  const submitReview = async (action) => {
    try {
      setSubmitting(true);
      await axios.patch(`http://localhost:3000/api/v1/visits/${visitId}/review`, {
        patientId,
        action,
        reviewNotes: notes
      }, {
        headers: { Authorization: 'Bearer test-user' }
      });
      
      alert(`Successfully marked as ${action}!`);
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Failed to submit review');
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button 
        onClick={() => navigate('/')} 
        className="btn btn-secondary" 
        style={{ marginBottom: '2rem', padding: '0.5rem 1rem' }}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText color="var(--accent-primary)" />
          Patient Review (Visit: {visitId})
        </h2>
        
        <p style={{ color: 'var(--text-secondary)' }}>
          Review the AI-generated assessment. If the AI suggestions are accurate, you can approve them. 
          If there are issues, you can correct or reject them. (Full visit details would load here from backend).
        </p>
        
        <div style={{ marginTop: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Doctor's Clinical Notes (Optional)</label>
          <textarea 
            className="input-field" 
            placeholder="Add your own observations or corrections to the AI output here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button 
          className="btn btn-success" 
          onClick={() => submitReview('approved')}
          disabled={submitting}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <Check size={20} /> Approve AI Output
        </button>
        
        <button 
          className="btn btn-primary" 
          onClick={() => submitReview('corrected')}
          disabled={submitting}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <Send size={20} /> Submit Corrections
        </button>

        <button 
          className="btn btn-danger" 
          onClick={() => submitReview('rejected')}
          disabled={submitting}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <X size={20} /> Reject (Incorrect)
        </button>
      </div>
    </div>
  );
}
