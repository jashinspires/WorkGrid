import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', description: '' });
    const { user } = useContext(AuthContext);

    const isAdmin = user?.role === 'tenant_admin' || user?.role === 'super_admin';

    useEffect(() => {
        fetchProjects();
    }, []);

    const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('saas_token')}` });

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/api/projects`, { headers: authHeader() });
            setProjects(res.data.data.projects);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/api/projects`, form, { headers: authHeader() });
            setForm({ name: '', description: '' });
            fetchProjects();
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating project');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;
        try {
            await axios.delete(`${API_BASE}/api/projects/${id}`, { headers: authHeader() });
            fetchProjects();
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting project');
        }
    };

    return (
        <>
            <header className="header-actions">
                <div>
                    <p className="eyebrow">Projects</p>
                    <h1>All projects</h1>
                </div>
                <div className="pill">{user?.tenant?.subdomain}</div>
            </header>

            {isAdmin && (
                <section className="panel">
                    <p className="eyebrow">Create</p>
                    <h3>New project</h3>
                    <form onSubmit={handleCreate} className="inline-form" style={{ marginTop: '12px', justifyContent: 'flex-start' }}>
                        <input
                            type="text"
                            placeholder="Project name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Description"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                        <button type="submit" className="btn primary">Create</button>
                    </form>
                </section>
            )}

            <section className="panel">
                <p className="eyebrow">Directory</p>
                <h3>All projects</h3>
                {loading ? <div className="empty">Loading...</div> : projects.length === 0 ? (
                    <div className="empty">No projects yet.</div>
                ) : (
                    <div className="project-grid" style={{ marginTop: '20px' }}>
                        {projects.map(p => (
                            <div key={p.id} className="project-card">
                                <div className="project-meta">
                                    <span className="eyebrow">{p.id.slice(0, 8)}</span>
                                    <span className="pill">{p.task_count || 0} tasks</span>
                                </div>
                                <h3>{p.name}</h3>
                                <p className="muted">{p.description || 'No description.'}</p>
                                <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', gap: '8px' }}>
                                    <Link to={`/projects/${p.id}`} className="btn ghost" style={{ flex: 1 }}>Open</Link>
                                    {isAdmin && <button onClick={() => handleDelete(p.id)} className="btn danger">Delete</button>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
};

export default ProjectsPage;
