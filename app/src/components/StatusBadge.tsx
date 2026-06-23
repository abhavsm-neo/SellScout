interface StatusBadgeProps {
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived' | 'error';
}

const styles = {
  draft: 'bg-white/[0.06] text-white/60',
  active: 'bg-success/12 text-success',
  paused: 'bg-gold/12 text-gold',
  completed: 'bg-info/12 text-info',
  archived: 'bg-white/[0.04] text-white/40',
  error: 'bg-danger/12 text-danger',
};

const labels = {
  draft: 'Draft',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
  error: 'Error',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[13px] font-medium tracking-[0.04em] ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
