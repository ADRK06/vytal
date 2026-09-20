import { requireUser } from "@/lib/auth";
import { AppHeader } from "@/components/auth/AppHeader";

export default async function DashboardLayout({
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
