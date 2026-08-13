import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ClipboardList, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function Dashboard() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPendingVisits = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/v1/visits/pending', {
        headers: { Authorization: 'Bearer test-user' }
      });
      setVisits(res.data.visits || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch pending reviews. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingVisits();
    const interval = setInterval(fetchPendingVisits, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0 }}>Pending Patient Reviews</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <Clock size={18} />
          <span>Auto-updating</span>
        </div>
      </div>

      {error && (
        <div className="glass-panel" style={{ padding: '1rem', borderColor: 'var(--danger)', color: 'var(--danger)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle />
          {error}
        </div>
      )}

      {loading && visits.length === 0 ? (
        <p>Loading queue...</p>
      ) : visits.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0' }}>All Caught Up!</h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>There are no patients awaiting your review right now.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {visits.map((visit) => (
            <Link to={`/review/${visit.id}/${visit.patientId || visit.id.split('_')[0]}`} key={visit.id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '1rem', borderRadius: '50%' }}>
                    <ClipboardList color="var(--accent-primary)" />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 0.25rem 0' }}>Visit ID: {visit.id.substring(0, 8)}...</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Status: <span style={{ color: 'var(--warning)', fontWeight: 600 }}>Needs Review</span> | 
                      Urgency: {visit.urgency?.toUpperCase() || 'ROUTINE'}
                    </p>
                  </div>
                </div>
                <button className="btn btn-primary">Review Now</button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
