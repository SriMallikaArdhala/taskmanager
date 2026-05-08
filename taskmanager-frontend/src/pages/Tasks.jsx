import { useState, useEffect } from 'react'
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
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    api.get('/projects')
      .then(async (r) => {
        const projectTasks = await Promise.all(
          r.data.map(p => api.get(`/projects/${p.id}/tasks`).then(res => res.data))
        )
        const all = projectTasks.flat()
        // Deduplicate by task id
        const unique = Array.from(new Map(all.map(t => [t.id, t])).values())
        setTasks(unique)
      })
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'ALL' ? tasks : tasks.filter(t => t.status === filter)

  if (loading) return <div className="loader"><div className="spinner" /></div>

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">My Tasks</div>
          <div className="page-subtitle">{tasks.length} total task{tasks.length !== 1 ? 's' : ''} across all projects</div>
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
              marginLeft: 6,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '1px 6px',
              fontSize: '0.7rem'
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
            <div className="empty-text">Tasks assigned to you will appear here.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(task => (
            <div key={task.id} className="card" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, marginBottom: 6, fontSize: '0.9rem' }}>{task.title}</div>
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
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      📁 {task.projectName}
                    </span>
                    {task.dueDate && (
                      <span style={{ fontSize: '0.75rem', color: task.overdue ? 'var(--danger)' : 'var(--text-muted)' }}>
                        Due: {task.dueDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
