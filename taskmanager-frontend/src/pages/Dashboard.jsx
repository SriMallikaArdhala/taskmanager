import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loader"><div className="spinner" /></div>

  const stats = [
    { label: 'Total Tasks',  value: data?.totalTasks ?? 0,      color: 'var(--accent)',  bg: 'var(--accent-dim)' },
    { label: 'To Do',        value: data?.todoCount ?? 0,        color: '#94a3b8',        bg: 'rgba(148,163,184,0.1)' },
    { label: 'In Progress',  value: data?.inProgressCount ?? 0,  color: '#3b82f6',        bg: 'rgba(59,130,246,0.1)' },
    { label: 'Done',         value: data?.doneCount ?? 0,        color: '#10b981',        bg: 'rgba(16,185,129,0.1)' },
    { label: 'Overdue',      value: data?.overdueCount ?? 0,     color: '#ef4444',        bg: 'rgba(239,68,68,0.1)' },
    { label: 'Projects',     value: data?.totalProjects ?? 0,    color: '#a78bfa',        bg: 'rgba(167,139,250,0.1)' },
  ]

  const maxTasks = Math.max(...(data?.tasksPerUser?.map(u => u.taskCount) ?? [1]), 1)

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Welcome back, {user?.name} 👋</div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 32 }}>
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color }} />
            </div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {data?.tasksPerUser?.length > 0 ? (
        <div className="card" style={{ padding: 24 }}>
          <div className="section-title">Tasks Per Team Member</div>
          <div className="bar-chart">
            {data.tasksPerUser.map((u) => (
              <div key={u.userName} className="bar-row">
                <div className="bar-label">{u.userName}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(u.taskCount / maxTasks) * 100}%` }} />
                </div>
                <div className="bar-count">{u.taskCount}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div className="section-title">No data yet</div>
            <div className="empty-text">Create projects and assign tasks to see analytics here.</div>
          </div>
        </div>
      )}
    </div>
  )
}
