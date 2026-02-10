import React, { useContext } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Layout = ({ children }) => {
    const { user, logout } = useContext(AuthContext);
    const isAdmin = user?.role === 'tenant_admin' || user?.role === 'super_admin';

    if (!user) return null;

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <p className="eyebrow">SaaS Engine</p>
                    <h2 style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>{user.tenant?.name || 'Workspace'}</h2>
                </div>

                <nav className="nav-links">
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span>📊</span> Dashboard
                    </NavLink>
                    <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span>📁</span> Projects
                    </NavLink>
                    {isAdmin && (
                        <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <span>👥</span> Team Members
                        </NavLink>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-badge">
                        <div className="avatar">{user.fullName?.[0] || user.email?.[0]}</div>
                        <div className="user-info">
                            <p className="eyebrow" style={{ fontSize: '0.7rem' }}>{user.role}</p>
                            <p style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{user.fullName || user.email}</p>
                        </div>
                    </div>
                    <button className="btn ghost" style={{ width: '100%' }} onClick={logout}>Logout</button>
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout;
