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
                    <p className="eyebrow">WorkGrid</p>
                    <h2 style={{ fontSize: '1rem', color: '#fff', marginTop: '2px' }}>
                        {user.tenant?.name || 'System'}
                    </h2>
                </div>

                <nav className="nav-links">
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span>Projects</span>
                    </NavLink>
                    {isAdmin && (
                        <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <span>Team</span>
                        </NavLink>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-badge">
                        <div className="avatar">{user.fullName?.[0] || user.email?.[0]}</div>
                        <div className="user-info">
                            <p style={{ fontSize: '0.65rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user.role?.replace('_', ' ')}</p>
                            <p style={{ fontSize: '0.8rem', color: '#e5e5e5' }}>{user.fullName || user.email}</p>
                        </div>
                    </div>
                    <button className="btn ghost" style={{ width: '100%', fontSize: '0.75rem' }} onClick={logout}>Sign out</button>
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default Layout;
