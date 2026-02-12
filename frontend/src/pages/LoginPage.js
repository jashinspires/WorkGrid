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
          <p className="eyebrow">WorkGrid</p>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>Welcome back.</h1>
          <p className="subhead">
            Sign in to access your isolated workspace. Data is scoped and protected at the database level.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
            <span className="pill">JWT Auth</span>
            <span className="pill">RBAC</span>
            <span className="pill">Tenant Isolation</span>
          </div>
        </div>

        <div className="auth-form">
          <div style={{ marginBottom: '24px' }}>
            <p className="eyebrow">Authentication</p>
            <h2>Sign in</h2>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <label className="field">
              <span>Subdomain</span>
              <input
                type="text"
                placeholder="e.g. demo"
                onChange={(e) => setForm({ ...form, subdomain: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                placeholder="you@company.com"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                placeholder="••••••••"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </label>
            <button type="submit" className="btn primary" style={{ marginTop: '8px', width: '100%' }}>Sign in</button>
          </form>

          <div style={{ marginTop: '24px', fontSize: '0.8rem' }}>
            <p style={{ color: '#666' }}>
              New here? <Link to="/register" style={{ color: '#e5e5e5', textDecoration: 'underline' }}>Create a workspace</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
