// TODO: shared "no data yet" / "sensor disconnected" placeholder.
export function EmptyState({ message }: { message?: string }) {
  return <div>{message ?? "No data yet."}</div>;
}
