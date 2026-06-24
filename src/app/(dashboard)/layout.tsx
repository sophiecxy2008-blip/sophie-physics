import { Sidebar } from "@/components/layout/sidebar";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <main className="lg:pl-60">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
