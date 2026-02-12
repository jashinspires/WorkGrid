import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const RegisterPage = () => {
  const [form, setForm] = useState({
    tenantName: '',
    subdomain: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    plan: 'free',
  });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register-tenant`, form);
      login(res.data.data);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="gradient-bg">
      <div className="auth-card">
        <div className="auth-hero">
          <p className="eyebrow">New Workspace</p>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>Create your workspace.</h1>
          <p className="subhead">
            Set up an isolated environment for your team with its own projects, members, and data.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
            <span className="pill">Scalable</span>
            <span className="pill">Isolated</span>
            <span className="pill">Secure</span>
          </div>
        </div>

        <div className="auth-form" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <p className="eyebrow">Setup</p>
            <h2>Register</h2>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label className="field">
                <span>Organization</span>
                <input
                  type="text"
                  placeholder="Acme Inc"
                  value={form.tenantName}
                  onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span>Subdomain</span>
                <input
                  type="text"
                  placeholder="acme"
                  value={form.subdomain}
                  onChange={(e) => setForm({ ...form, subdomain: e.target.value })}
                  required
                />
              </label>
            </div>

            <label className="field">
              <span>Full name</span>
              <input
                type="text"
                placeholder="Jane Doe"
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                placeholder="admin@acme.com"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                placeholder="Create a strong password"
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Plan</span>
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
              >
                <option value="free">Free — 3 projects</option>
                <option value="pro">Pro — 15 projects</option>
                <option value="enterprise">Enterprise — Unlimited</option>
              </select>
            </label>
            <button type="submit" className="btn primary" style={{ marginTop: '8px', width: '100%' }}>Create workspace</button>
          </form>

          <div style={{ marginTop: '24px', fontSize: '0.8rem', textAlign: 'center' }}>
            <Link to="/login" style={{ color: '#e5e5e5', textDecoration: 'underline' }}>Already have a workspace? Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
