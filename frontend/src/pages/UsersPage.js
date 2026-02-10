import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ email: '', fullName: '', password: '', role: 'user' });
    const { user: currentUser } = useContext(AuthContext);

    const tenantId = currentUser?.tenantId || currentUser?.tenant?.id;
    const isAdmin = currentUser?.role === 'tenant_admin' || currentUser?.role === 'super_admin';

    useEffect(() => {
        if (tenantId) fetchUsers();
    }, [tenantId]);

    const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('saas_token')}` });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/users/${tenantId}/users`, { headers: authHeader() });
            setUsers(res.data.data.users);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/api/users/${tenantId}/users`, form, { headers: authHeader() });
            setForm({ email: '', fullName: '', password: '', role: 'user' });
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Error adding user');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`${API_BASE}/api/users/${userId}`, { headers: authHeader() });
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting user');
        }
    };

    return (
        <>
            <header className="header-actions">
                <div>
                    <p className="eyebrow">Identity & Access</p>
                    <h1>Team Directory</h1>
                </div>
                <div className="pill">Current Tenant: {currentUser?.tenant?.name}</div>
            </header>

            {isAdmin && (
                <section className="panel">
                    <p className="eyebrow">Provisioning</p>
                    <h3>Add Workspace Member</h3>
                    <form onSubmit={handleAddUser} className="inline-form" style={{ marginTop: '1rem', justifyContent: 'flex-start' }}>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={form.fullName}
                            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Corporate Email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Secure Pass"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required
                        />
                        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                            <option value="user">User</option>
                            <option value="tenant_admin">Admin</option>
                        </select>
                        <button type="submit" className="btn primary">Provision</button>
                    </form>
                </section>
            )}

            <section className="panel">
                <p className="eyebrow">Registry</p>
                <h3>Active Members</h3>
                {loading ? <div className="empty">Synchronizing team...</div> : (
                    <div className="project-grid" style={{ marginTop: '1.5rem' }}>
                        {users.map(u => (
                            <div key={u.id} className="project-card">
                                <div className="project-meta">
                                    <span className="eyebrow">{u.role}</span>
                                    <span className={`pill ${u.role === 'tenant_admin' ? 'pro' : ''}`}>{u.id === currentUser?.id ? 'You' : 'Active'}</span>
                                </div>
                                <h3>{u.full_name}</h3>
                                <p className="muted">{u.email}</p>
                                {isAdmin && u.id !== currentUser?.id && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <button onClick={() => handleDelete(u.id)} className="btn danger" style={{ width: '100%' }}>Deauthorize</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
};

export default UsersPage;
