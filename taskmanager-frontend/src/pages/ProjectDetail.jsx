import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import TaskCard from '../components/TaskCard'
import toast from 'react-hot-toast'

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE']
const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' }
const COL_COLORS = { TODO: '#94a3b8', IN_PROGRESS: '#3b82f6', DONE: '#10b981' }

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editTask, setEditTask] = useState(null)

  const [taskForm, setTaskForm] = useState({
    title: '', description: '', dueDate: '', priority: 'MEDIUM',
    status: 'TODO', assignedToId: ''
  })
  const [memberEmail, setMemberEmail] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [projRes, taskRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/tasks`),
      ])
      setProject(projRes.data)
      setTasks(taskRes.data)
      const me = projRes.data.members?.find(m => m.userId === user?.id)
      setIsAdmin(me?.role === 'ADMIN')
    } catch {
      toast.error('Failed to load project')
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const openEditTask = (task) => {
    if (!isAdmin && task.assignedToId !== user?.id) return
    setEditTask(task)
    setTaskForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate || '',
      priority: task.priority,
      status: task.status,
      assignedToId: task.assignedToId || ''
    })
    setShowTaskModal(true)
  }

  const openNewTask = () => {
    setEditTask(null)
    setTaskForm({ title: '', description: '', dueDate: '', priority: 'MEDIUM', status: 'TODO', assignedToId: '' })
    setShowTaskModal(true)
  }

  const submitTask = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...taskForm,
        assignedToId: taskForm.assignedToId ? Number(taskForm.assignedToId) : null,
        dueDate: taskForm.dueDate || null,
      }
      if (editTask) {
        await api.put(`/tasks/${editTask.id}`, payload)
        toast.success('Task updated!')
      } else {
        await api.post(`/projects/${id}/tasks`, payload)
        toast.success('Task created!')
      }
      setShowTaskModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save task')
    } finally {
      setSaving(false)
    }
  }

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return
    try {
      await api.delete(`/tasks/${taskId}`)
      toast.success('Task deleted')
      load()
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const addMember = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail })
      toast.success('Member added!')
      setMemberEmail('')
      setShowMemberModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member')
    } finally {
      setSaving(false)
    }
  }

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return
    try {
      await api.delete(`/projects/${id}/members/${userId}`)
      toast.success('Member removed')
      load()
    } catch {
      toast.error('Failed to remove member')
    }
  }

  if (loading) return <div className="loader"><div className="spinner" /></div>
  if (!project) return null

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s)
    return acc
  }, {})

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <button
            onClick={() => navigate('/projects')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Back to Projects
          </button>
          <div className="page-title">{project.name}</div>
          {project.description && <div className="page-subtitle">{project.description}</div>}
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}>
              + Add Member
            </button>
            <button className="btn btn-primary btn-sm" onClick={openNewTask}>
              + New Task
            </button>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Team Members</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {project.members?.length} member{project.members?.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="members-list">
          {project.members?.map((m) => (
            <div key={m.userId} className="member-row">
              <div className="member-info">
                <div className="member-avatar">{m.name?.[0]?.toUpperCase()}</div>
                <div>
                  <div className="member-name">{m.name}</div>
                  <div className="member-email">{m.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge badge-${m.role.toLowerCase()}`}>{m.role}</span>
                {isAdmin && m.userId !== user?.id && (
                  <button
                    className="btn btn-danger btn-sm btn-icon"
                    onClick={() => removeMember(m.userId)}
                    title="Remove member">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="task-board">
        {STATUSES.map((status) => (
          <div key={status} className="board-col">
            <div className="board-col-header">
              <div className="board-col-title" style={{ color: COL_COLORS[status] }}>
                {STATUS_LABELS[status]}
              </div>
              <div className="col-count">{tasksByStatus[status].length}</div>
            </div>
            <div className="task-cards-list">
              {tasksByStatus[status].length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No tasks
                </div>
              ) : (
                tasksByStatus[status].map(task => (
                  <div key={task.id} style={{ position: 'relative' }}>
                    <TaskCard task={task} onClick={() => openEditTask(task)} />
                    {isAdmin && (
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        style={{ position: 'absolute', top: 8, right: 8, padding: '3px 5px', opacity: 0.7 }}
                        onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }}
                        title="Delete task">
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <Modal title={editTask ? 'Edit Task' : 'New Task'} onClose={() => setShowTaskModal(false)}>
          <form className="modal-form" onSubmit={submitTask}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                className="form-input"
                value={taskForm.title}
                onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                required={!editTask}
                disabled={!!editTask && !isAdmin}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                value={taskForm.description}
                onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                disabled={!!editTask && !isAdmin}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={taskForm.dueDate}
                  onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  disabled={!!editTask && !isAdmin}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={taskForm.priority}
                  onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                  disabled={!!editTask && !isAdmin}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={taskForm.status}
                  onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              {isAdmin && (
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select
                    className="form-select"
                    value={taskForm.assignedToId}
                    onChange={e => setTaskForm({ ...taskForm, assignedToId: e.target.value })}>
                    <option value="">Unassigned</option>
                    {project.members?.map(m => (
                      <option key={m.userId} value={m.userId}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <Modal title="Add Member" onClose={() => setShowMemberModal(false)}>
          <form className="modal-form" onSubmit={addMember}>
            <div className="form-group">
              <label className="form-label">Member Email *</label>
              <input
                className="form-input"
                type="email"
                placeholder="colleague@example.com"
                value={memberEmail}
                onChange={e => setMemberEmail(e.target.value)}
                required
              />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              The user must already have a TaskFlow account.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
