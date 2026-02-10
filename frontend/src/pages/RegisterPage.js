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
          <p className="eyebrow">Expansion Pack</p>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Provision New Tenant.</h1>
          <p className="subhead" style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
            Scale your organization with an isolated instance. Choose a plan that fits your growth.
          </p>
          <div className="pill-list" style={{ listStyleType: 'none', padding: 0, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span className="pill">Scalable</span>
            <span className="pill">Isolated</span>
            <span className="pill">Modern</span>
          </div>
        </div>

        <div className="auth-form" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          <div className="form-header" style={{ marginBottom: '1rem' }}>
            <p className="eyebrow">Organization Setup</p>
            <h2>Register Workspace</h2>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label className="field">
                <span>Tenant Name</span>
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
              <span>Admin Full Name</span>
              <input
                type="text"
                placeholder="Jane Doe"
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Admin Email</span>
              <input
                type="email"
                placeholder="admin@acme.com"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Security Password</span>
              <input
                type="password"
                placeholder="Create a strong password"
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Service Plan</span>
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
              >
                <option value="free">Free (3 Projects)</option>
                <option value="pro">Pro (15 Projects)</option>
                <option value="enterprise">Enterprise (Infinity)</option>
              </select>
            </label>
            <button type="submit" className="btn primary" style={{ marginTop: '1rem' }}>Provision Workspace</button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link to="/login" className="muted" style={{ fontSize: '0.9rem' }}>Already have a workspace? Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
