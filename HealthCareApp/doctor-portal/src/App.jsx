import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import PatientReview from './pages/PatientReview';

function App() {
  return (
    <Router>
      <div className="container">
        <header className="glass-panel" style={{ padding: '1rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Activity color="var(--accent-primary)" size={32} />
          <div>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <h1 className="title-gradient" style={{ margin: 0, fontSize: '1.5rem' }}>VirtualCare</h1>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Doctor Review Portal</p>
            </Link>
          </div>
        </header>
        
        <main className="animate-fade-in">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/review/:visitId/:patientId" element={<PatientReview />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
