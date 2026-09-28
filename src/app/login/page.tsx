import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { isDashboardAuthEnabled } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Login · Story Maker",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (!isDashboardAuthEnabled()) redirect(safeNext);
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <LoginForm next={safeNext} />
    </main>
  );
}
