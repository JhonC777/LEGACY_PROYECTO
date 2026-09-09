import type { ProjectStatus } from '@/data/demoData'
import { cn } from '@/lib/cn'
import { STATUS_LABEL } from '../types'

export function StatusBadge({
  status,
  className,
}: {
  status: ProjectStatus
  className?: string
}) {
  return (
    <span className={cn('admin-status', `is-${status}`, className)}>
      <span className="admin-status-dot" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  )
}
