import { Link } from 'react-router-dom'

export default function ProjectCard({ project }) {
  const progress = project.totalTasks > 0
    ? Math.round((project.doneTasks / project.totalTasks) * 100)
    : 0

  return (
    <Link to={`/projects/${project.id}`} className="project-card">
      <div className="project-card-name">{project.name}</div>
      <div className="project-card-desc">{project.description || 'No description provided.'}</div>
      <div className="project-progress">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>{project.doneTasks}/{project.totalTasks} tasks done</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="project-footer">
        <div className="member-stack">
          {project.members?.slice(0, 5).map((m) => (
            <div key={m.userId} className="member-dot" title={m.name}>
              {m.name?.[0]?.toUpperCase()}
            </div>
          ))}
          {project.members?.length > 5 && (
            <div className="member-dot">+{project.members.length - 5}</div>
          )}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {project.members?.length} member{project.members?.length !== 1 ? 's' : ''}
        </span>
      </div>
    </Link>
  )
}
