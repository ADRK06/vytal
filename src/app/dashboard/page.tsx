import { PostureCard } from "@/components/dashboard/PostureCard";
import { HydrationCard } from "@/components/dashboard/HydrationCard";

// TODO: SessionTimer, CorrelationChart.
// TODO: sessionId should come from useSession() once real session lifecycle exists.
const DEV_SESSION_ID = "dev-preview";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:px-16">
      <div className="grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        <PostureCard />
        <HydrationCard sessionId={DEV_SESSION_ID} />
      </div>
    </main>
  );
}
