import AdminSidebar from "@/components/admin/sidebar";

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <div className="flex">
        <AdminSidebar />
        <main className="min-h-screen flex-1 p-8 text-[#0b1220]">
          {children}
        </main>
      </div>
    </div>
  );
}