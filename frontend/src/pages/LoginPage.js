import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '', subdomain: '' });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        email: form.email,
        password: form.password,
        tenantSubdomain: form.subdomain,
      });
      login(res.data.data);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="gradient-bg">
      <div className="auth-card">
        <div className="auth-hero">
          <p className="eyebrow">Enterprise Ready</p>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Multi-Tenant Control Plane.</h1>
          <p className="subhead" style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
            Access your secure, isolated workspace. All data is scoped and protected at the database level.
          </p>
          <div className="pill-list" style={{ listStyleType: 'none', padding: 0, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span className="pill">JWT v2</span>
            <span className="pill">Postgres Isolation</span>
            <span className="pill">RBAC Enabled</span>
          </div>
        </div>

        <div className="auth-form">
          <div className="form-header" style={{ marginBottom: '2rem' }}>
            <p className="eyebrow">Authentication</p>
            <h2>Tenant Login</h2>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <label className="field">
              <span>Tenant Subdomain</span>
              <input
                type="text"
                placeholder="e.g., demo"
                onChange={(e) => setForm({ ...form, subdomain: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Admin Email</span>
              <input
                type="email"
                placeholder="you@company.com"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Master Password</span>
              <input
                type="password"
                placeholder="••••••••"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </label>
            <button type="submit" className="btn primary" style={{ marginTop: '1rem' }}>Sign In to Workspace</button>
          </form>

          <div className="hint" style={{ marginTop: '2rem' }}>
            <p className="muted">
              First time here? <Link to="/register" style={{ color: 'var(--accent)' }}>Provision new tenant</Link>
            </p>
          </div>

          <div className="hint">
            <p className="eyebrow" style={{ fontSize: '0.7rem' }}>Demo Instance</p>
            <p style={{ fontSize: '0.8rem' }}>Subdomain: <b>demo</b> · admin@demo.com · Demo@123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
