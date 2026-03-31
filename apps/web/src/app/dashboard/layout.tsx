import Sidebar from "@/components/dashboard/sidebar";
import ProtectedRoute from "@/components/auth/protected-route";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_25%),linear-gradient(to_bottom,#020617,#0f172a_35%,#111827_100%)]">
        <div className="flex">
          <Sidebar />
          <main className="min-h-screen flex-1 p-8 text-white">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}