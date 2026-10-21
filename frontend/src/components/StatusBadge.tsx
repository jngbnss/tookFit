export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <span className={`status status-${status}`}>{label}</span>;
}
