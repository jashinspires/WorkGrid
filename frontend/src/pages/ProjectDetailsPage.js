import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

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
                    <p className="eyebrow">Project Instance</p>
                    <h1>{project.name}</h1>
                </div>
                <div className="pill">Execution Unit: {projectId.slice(0, 8)}</div>
            </header>

            <section className="panel">
                <p className="eyebrow">Metadata</p>
                <h3>Domain Description</h3>
                <p className="subhead" style={{ marginTop: '0.5rem' }}>{project.description || 'No extended metadata available for this instance.'}</p>
            </section>

            <section className="task-layout" style={{ marginTop: '2rem' }}>
                <div className="panel">
                    <p className="eyebrow">Task Injection</p>
                    <h3>Add New Task</h3>
                    <form onSubmit={handleAddTask} className="form-grid" style={{ marginTop: '1rem' }}>
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
                            <span>Importance</span>
                            <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <button type="submit" className="btn primary">Inject Task</button>
                    </form>
                </div>

                <div className="panel">
                    <p className="eyebrow">Task Buffer</p>
                    <h3>Active Tasks ({tasks.length})</h3>
                    <div className="task-list" style={{ marginTop: '1rem' }}>
                        {tasks.length === 0 ? <div className="empty">No tasks in queue.</div> : tasks.map(t => (
                            <div key={t.id} className="task-card">
                                <div className="task-meta">
                                    <span className={`pill ${t.priority}`}>{t.priority}</span>
                                    <select
                                        value={t.status}
                                        onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: '0.8rem' }}
                                    >
                                        <option value="todo">Todo</option>
                                        <option value="in_progress">Working</option>
                                        <option value="done">Completed</option>
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
