import { AppShell } from "@/components/shell/app-shell";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/queries/households";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getAppContext();
  if (!context) redirect("/login");
  if (!context.household) redirect("/onboarding");
  return (
    <AppShell user={context.user} household={context.household}>
      {children}
    </AppShell>
  );
}
