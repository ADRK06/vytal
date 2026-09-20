import { PostureCard } from "@/components/dashboard/PostureCard";

// TODO: HydrationCard, SessionTimer, CorrelationChart.
export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:px-16">
      <div className="max-w-sm">
        <PostureCard />
      </div>
    </main>
  );
}
