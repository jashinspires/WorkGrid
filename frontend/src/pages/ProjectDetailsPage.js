import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ProjectDetailsPage = () => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium' });
    const { user } = useContext(AuthContext);

    const isAdmin = user?.role === 'tenant_admin' || user?.role === 'super_admin';

    useEffect(() => {
        fetchData();
    }, [projectId]);

    const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('saas_token')}` });

    const fetchData = async () => {
        setLoading(true);
        try {
            const projRes = await axios.get(`${API_BASE}/api/projects`, { headers: authHeader() });
            const currentProj = projRes.data.data.projects.find(p => p.id === projectId);
            setProject(currentProj);

            const tasksRes = await axios.get(`${API_BASE}/api/projects/${projectId}/tasks`, { headers: authHeader() });
            setTasks(tasksRes.data.data.tasks);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/api/projects/${projectId}/tasks`, taskForm, { headers: authHeader() });
            setTaskForm({ title: '', description: '', priority: 'medium' });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error adding task');
        }
    };

    const handleUpdateStatus = async (taskId, status) => {
        try {
            await axios.patch(`${API_BASE}/api/tasks/${taskId}/status`, { status }, { headers: authHeader() });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating task');
        }
    };

    if (loading) return <div className="page-shell">Loading...</div>;
    if (!project) return <div className="page-shell">Project not found</div>;

    return (
        <>
            <header className="header-actions">
                <div>
                    <p className="eyebrow">Project</p>
                    <h1>{project.name}</h1>
                </div>
                <div className="pill">{projectId.slice(0, 8)}</div>
            </header>

            <section className="panel">
                <p className="eyebrow">About</p>
                <h3>Description</h3>
                <p className="subhead" style={{ marginTop: '8px' }}>{project.description || 'No description provided.'}</p>
            </section>

            <section className="task-layout" style={{ marginTop: '24px' }}>
                <div className="panel">
                    <p className="eyebrow">Create</p>
                    <h3>New task</h3>
                    <form onSubmit={handleAddTask} className="form-grid" style={{ marginTop: '12px' }}>
                        <div className="field">
                            <span>Title</span>
                            <input
                                type="text"
                                placeholder="What needs to be done?"
                                value={taskForm.title}
                                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="field">
                            <span>Priority</span>
                            <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <button type="submit" className="btn primary">Add task</button>
                    </form>
                </div>

                <div className="panel">
                    <p className="eyebrow">Tasks</p>
                    <h3>All tasks ({tasks.length})</h3>
                    <div className="task-list" style={{ marginTop: '12px' }}>
                        {tasks.length === 0 ? <div className="empty">No tasks yet.</div> : tasks.map(t => (
                            <div key={t.id} className="task-card">
                                <div className="task-meta">
                                    <span className={`pill ${t.priority}`}>{t.priority}</span>
                                    <select
                                        value={t.status}
                                        onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '0.8rem' }}
                                    >
                                        <option value="todo">Todo</option>
                                        <option value="in_progress">In progress</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>
                                <h4>{t.title}</h4>
                                <p className="muted" style={{ fontSize: '0.85rem' }}>{t.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
};

export default ProjectDetailsPage;
