import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

// ── tiny inline Progress Ring ──────────────────────────────
function Ring({ pct, color, size = 54 }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  )
}

// ── Stat Card ──────────────────────────────────────────────
function StatCard({ label, value, color, bg, icon, pct }) {
  return (
    <div className="stat-card" style={{ position: 'relative', overflow: 'hidden', padding: '20px 18px' }}>
      {/* subtle corner glow */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: color, opacity: 0.07, pointerEvents: 'none'
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: bg, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 18, marginBottom: 14
          }}>{icon}</div>
          <div className="stat-value" style={{ color, fontSize: '1.9rem', lineHeight: 1, marginBottom: 4 }}>
            {value}
          </div>
          <div className="stat-label" style={{ fontSize: '0.75rem' }}>{label}</div>
        </div>
        {pct !== undefined && (
          <div style={{ position: 'relative' }}>
            <Ring pct={pct} color={color} />
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6rem', color, fontWeight: 600
            }}>{pct}%</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Priority badge colors ──────────────────────────────────
const PRIORITY_COLORS = {
  HIGH:     { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
  CRITICAL: { bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
  MEDIUM:   { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  LOW:      { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e' },
}
const STATUS_COLORS = {
  TODO:        { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' },
  IN_PROGRESS: { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6' },
  DONE:        { bg: 'rgba(16,185,129,0.15)',  color: '#10b981' },
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLogout, setShowLogout] = useState(false)

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  if (loading) return <div className="loader"><div className="spinner" /></div>

  // ── Correct field names matching DashboardService.java ──
  const total      = data?.totalTasks      ?? 0
  const todo       = data?.todoCount       ?? 0   // DashboardService sends todoCount
  const inProgress = data?.inProgressCount ?? 0   // DashboardService sends inProgressCount
  const done       = data?.doneCount       ?? 0   // DashboardService sends doneCount
  const overdue    = data?.overdueCount    ?? 0   // DashboardService sends overdueCount
  const projects   = data?.totalProjects   ?? 0

  // Completion percentage for ring
  const donePct  = total > 0 ? Math.round((done / total) * 100) : 0
  const overPct  = total > 0 ? Math.round((overdue / total) * 100) : 0

  const stats = [
    { label: 'Total Tasks',  value: total,      color: '#6c63ff', bg: 'rgba(108,99,255,0.15)', icon: '📋', pct: undefined },
    { label: 'To Do',        value: todo,       color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: '📝', pct: total > 0 ? Math.round((todo/total)*100) : 0 },
    { label: 'In Progress',  value: inProgress, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: '🔄', pct: total > 0 ? Math.round((inProgress/total)*100) : 0 },
    { label: 'Done',         value: done,       color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: '✅', pct: donePct },
    { label: 'Overdue',      value: overdue,    color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  icon: '⚠️', pct: overPct },
    { label: 'Projects',     value: projects,   color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', icon: '📁', pct: undefined },
  ]

  const maxTasks = Math.max(...(data?.tasksPerUser?.map(u => u.taskCount) ?? [1]), 1)
  const recentTasks = []  // backend DashboardService does not send recentTasks

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <div className="page-enter">

      {/* ── Header with logout ─────────────────────────── */}
      <div className="page-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Welcome back, {user?.name} 👋</div>
        </div>

        {/* User avatar + logout dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowLogout(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
              color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.85rem',
              transition: 'border-color .2s'
            }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--accent-dim)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.75rem', flexShrink: 0
            }}>{initials}</div>
            <div style={{ textAlign: 'left', lineHeight: 1.3 }}>
              <div style={{ fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user?.email}</div>
            </div>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2}
              style={{ color: 'var(--text-muted)', marginLeft: 2,
                transform: showLogout ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
              <path d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          {showLogout && (
            <>
              {/* click-away overlay */}
              <div style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                onClick={() => setShowLogout(false)} />
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 100,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: 6, minWidth: 180,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
              }}>
                <button
                  onClick={() => { setShowLogout(false); navigate('/projects') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '9px 12px', borderRadius: 7, border: 'none',
                    background: 'none', cursor: 'pointer', color: 'var(--text-primary)',
                    fontFamily: 'inherit', fontSize: '0.85rem', textAlign: 'left'
                  }}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  </svg>
                  Projects
                </button>
                <button
                  onClick={() => { setShowLogout(false); navigate('/tasks') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '9px 12px', borderRadius: 7, border: 'none',
                    background: 'none', cursor: 'pointer', color: 'var(--text-primary)',
                    fontFamily: 'inherit', fontSize: '0.85rem', textAlign: 'left'
                  }}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  My Tasks
                </button>
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '9px 12px', borderRadius: 7, border: 'none',
                    background: 'none', cursor: 'pointer', color: '#ef4444',
                    fontFamily: 'inherit', fontSize: '0.85rem', textAlign: 'left'
                  }}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* ── Progress overview bar ───────────────────────── */}
      {total > 0 && (
        <div className="card" style={{ padding: '18px 22px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Overall Progress</div>
            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>{donePct}% complete</span>
          </div>
          <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 5,
              background: 'linear-gradient(90deg, #6c63ff, #10b981)',
              width: `${donePct}%`, transition: 'width 1s cubic-bezier(.4,0,.2,1)'
            }} />
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
            {[
              { label: 'To Do',       value: todo,       color: '#94a3b8' },
              { label: 'In Progress', value: inProgress, color: '#3b82f6' },
              { label: 'Done',        value: done,       color: '#10b981' },
              { label: 'Overdue',     value: overdue,    color: '#ef4444' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                {item.label}: <span style={{ color: item.color, fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* ── Tasks Per Team Member bar chart ──────────── */}
        <div className="card" style={{ padding: 22 }}>
          <div className="section-title">Tasks Per Team Member</div>
          {(data?.tasksPerUser?.length ?? 0) > 0 ? (
            <div className="bar-chart" style={{ marginTop: 16 }}>
              {data.tasksPerUser.map((u) => (
                <div key={u.userName} className="bar-row" style={{ marginBottom: 12 }}>
                  <div className="bar-label" style={{ minWidth: 90, fontSize: '0.78rem' }}>
                    {u.userName}
                  </div>
                  <div className="bar-track" style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div className="bar-fill" style={{
                      width: `${(u.taskCount / maxTasks) * 100}%`,
                      height: '100%', borderRadius: 4,
                      background: 'linear-gradient(90deg, #6c63ff, #3b82f6)',
                      transition: 'width 0.8s cubic-bezier(.4,0,.2,1)'
                    }} />
                  </div>
                  <div className="bar-count" style={{ minWidth: 24, textAlign: 'right', fontSize: '0.78rem', fontWeight: 600, color: '#6c63ff' }}>
                    {u.taskCount}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-icon">👥</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No member data yet</div>
            </div>
          )}
        </div>

        {/* ── Quick Actions ────────────────────────────── */}
        <div className="card" style={{ padding: 22 }}>
          <div className="section-title">Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {[
              { label: 'View All Projects', icon: '📁', path: '/projects', color: '#6c63ff', bg: 'rgba(108,99,255,0.12)' },
              { label: 'My Assigned Tasks', icon: '✅', path: '/tasks',    color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
              { label: 'Overdue Tasks',     icon: '⚠️', path: '/tasks',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)',
                badge: overdue > 0 ? overdue : null },
            ].map(a => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 10,
                  background: a.bg, border: `1px solid ${a.color}22`,
                  cursor: 'pointer', width: '100%', textAlign: 'left',
                  fontFamily: 'inherit', color: a.color, fontWeight: 500, fontSize: '0.85rem',
                  transition: 'transform .15s, box-shadow .15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 16px ${a.color}22` }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
                <span style={{ fontSize: 18 }}>{a.icon}</span>
                <span style={{ flex: 1 }}>{a.label}</span>
                {a.badge != null && (
                  <span style={{
                    background: a.color, color: '#fff',
                    borderRadius: 20, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700
                  }}>{a.badge}</span>
                )}
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Tasks ────────────────────────────────── */}
      {recentTasks.length > 0 && (
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Recent Tasks</div>
            <button
              onClick={() => navigate('/tasks')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--accent)', fontSize: '0.8rem', fontFamily: 'inherit', fontWeight: 500
              }}>View all →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentTasks.map(task => {
              const p = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM
              const s = STATUS_COLORS[task.status]    || STATUS_COLORS.TODO
              return (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 10,
                  background: 'var(--surface-2, rgba(255,255,255,0.03))',
                  border: '1px solid var(--border)'
                }}>
                  {/* Status dot */}
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  {/* Title */}
                  <div style={{ flex: 1, fontWeight: 500, fontSize: '0.85rem',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {task.title}
                  </div>
                  {/* Project */}
                  {task.projectName && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)',
                      background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '2px 8px',
                      whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {task.projectName}
                    </span>
                  )}
                  {/* Priority badge */}
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px',
                    borderRadius: 6, background: p.bg, color: p.color,
                    textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0
                  }}>{task.priority}</span>
                  {/* Status badge */}
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px',
                    borderRadius: 6, background: s.bg, color: s.color,
                    textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0
                  }}>{task.status.replace('_', ' ')}</span>
                  {/* Overdue */}
                  {task.overdue && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px',
                      borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: '#ef4444', flexShrink: 0
                    }}>OVERDUE</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Empty state when no data at all ─────────────── */}
      {total === 0 && recentTasks.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div className="section-title">No data yet</div>
            <div className="empty-text">Create projects and assign tasks to see analytics here.</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}
              onClick={() => navigate('/projects')}>
              Create a Project
            </button>
          </div>
        </div>
      )}
    </div>
  )
}