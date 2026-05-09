import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'

const STATUSES = ['ALL', 'TODO', 'IN_PROGRESS', 'DONE']
const STATUS_LABELS = { ALL: 'All', TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' }

const statusBadgeClass = (status) => {
  if (status === 'IN_PROGRESS') return 'inprogress'
  return status.toLowerCase()
}

const statusDisplayLabel = (status) => {
  if (status === 'IN_PROGRESS') return 'In Progress'
  if (status === 'TODO') return 'To Do'
  return 'Done'
}

export default function Tasks() {
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('ALL')
  const [updating, setUpdating] = useState(null)
  const navigate = useNavigate()

  const load = () => {
    // Fix: use the dedicated /tasks/my endpoint instead of
    // fetching all projects and flattening — that pulled ALL tasks,
    // not just the ones assigned to the current user.
    api.get('/tasks/my')
      .then(r => setTasks(r.data))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // Members can update their own task status directly from this page
  const handleStatusChange = async (taskId, newStatus) => {
    setUpdating(taskId)
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus })
      toast.success('Status updated!')
      load()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdating(null)
    }
  }

  const filtered = filter === 'ALL' ? tasks : tasks.filter(t => t.status === filter)
  const overdue  = tasks.filter(t => t.overdue).length

  if (loading) return <div className="loader"><div className="spinner" /></div>

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">My Tasks</div>
          <div className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you
            {overdue > 0 && (
              <span style={{
                background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                borderRadius: 20, padding: '1px 10px', fontSize: '0.72rem', fontWeight: 700
              }}>
                {overdue} overdue
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="tabs">
        {STATUSES.map(s => (
          <button
            key={s}
            className={`tab${filter === s ? ' active' : ''}`}
            onClick={() => setFilter(s)}>
            {STATUS_LABELS[s]}
            <span style={{
              marginLeft: 6, background: 'rgba(255,255,255,0.08)',
              borderRadius: 10, padding: '1px 6px', fontSize: '0.7rem'
            }}>
              {s === 'ALL' ? tasks.length : tasks.filter(t => t.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="section-title">No tasks here</div>
            <div className="empty-text">
              {filter === 'ALL'
                ? 'No tasks are assigned to you yet. Ask your project admin to assign some.'
                : `No ${STATUS_LABELS[filter].toLowerCase()} tasks.`}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(task => (
            <div key={task.id} className="card" style={{
              padding: '14px 18px',
              borderLeft: task.overdue ? '3px solid #ef4444' : '3px solid transparent'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, marginBottom: 6, fontSize: '0.9rem' }}>
                    {task.title}
                  </div>
                  {task.description && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                      {task.description}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                    <span className={`badge badge-${statusBadgeClass(task.status)}`}>
                      {statusDisplayLabel(task.status)}
                    </span>
                    {task.overdue && <span className="badge badge-overdue">OVERDUE</span>}
                    {task.projectName && (
                      <span
                        onClick={() => navigate(`/projects/${task.projectId}`)}
                        style={{
                          fontSize: '0.75rem', color: 'var(--text-muted)',
                          cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2
                        }}>
                        📁 {task.projectName}
                      </span>
                    )}
                    {task.dueDate && (
                      <span style={{
                        fontSize: '0.75rem',
                        color: task.overdue ? '#ef4444' : 'var(--text-muted)'
                      }}>
                        📅 Due: {task.dueDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Inline status updater — members can update their own tasks */}
                <div style={{ flexShrink: 0 }}>
                  <select
                    value={task.status}
                    disabled={updating === task.id}
                    onChange={e => handleStatusChange(task.id, e.target.value)}
                    className="form-select"
                    style={{ fontSize: '0.78rem', padding: '5px 10px', minWidth: 120 }}>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}