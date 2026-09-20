interface EmptyStateProps {
  message?: string;
  className?: string;
}

export function EmptyState({ message, className = "" }: EmptyStateProps) {
  return (
    <div className={`text-sm text-text-dim ${className}`}>
      {message ?? "No data yet."}
    </div>
  );
}
