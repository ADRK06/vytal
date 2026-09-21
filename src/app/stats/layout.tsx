import { requireUser } from "@/lib/auth";
import { AppHeader } from "@/components/auth/AppHeader";

export default async function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
