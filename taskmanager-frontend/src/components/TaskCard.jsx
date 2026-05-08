import { format, parseISO } from 'date-fns'

const priorityClass = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high' }

export default function TaskCard({ task, onClick }) {
  const isOverdue = task.overdue

  return (
    <div className="task-card" onClick={() => onClick && onClick(task)}>
      <div className="task-card-title">{task.title}</div>
      <div className="task-meta">
        <span className={`badge badge-${priorityClass[task.priority]}`}>{task.priority}</span>
        {task.assignedToName && (
          <span className="task-assignee">
            <span style={{
              width: 18, height: 18, borderRadius: '50%', background: 'var(--accent-dim)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0
            }}>
              {task.assignedToName[0].toUpperCase()}
            </span>
            {task.assignedToName}
          </span>
        )}
        {task.dueDate && (
          <span className={`task-due${isOverdue ? ' overdue' : ''}`}>
            {isOverdue ? '⚠ ' : ''}
            {format(parseISO(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  )
}
