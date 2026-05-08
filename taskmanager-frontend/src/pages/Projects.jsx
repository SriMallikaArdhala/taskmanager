import { useState, useEffect } from 'react'
import api from '../api/axios'
import ProjectCard from '../components/ProjectCard'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    api.get('/projects')
      .then(r => setProjects(r.data))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/projects', form)
      toast.success('Project created!')
      setShowModal(false)
      setForm({ name: '', description: '' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loader"><div className="spinner" /></div>

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <div className="page-title">Projects</div>
          <div className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} total</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <div className="section-title">No projects yet</div>
            <div className="empty-text">Create your first project to get started.</div>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => setShowModal(true)}>
              Create Project
            </button>
          </div>
        </div>
      ) : (
        <div className="grid-2">
          {projects.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      {showModal && (
        <Modal title="New Project" onClose={() => setShowModal(false)}>
          <form className="modal-form" onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input className="form-input" name="name" placeholder="e.g. Marketing Website"
                value={form.name} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" name="description"
                placeholder="Brief description..." value={form.description} onChange={handle} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
