import VendorSidebar from "@/components/vendor/sidebar";
import ProtectedRoute from "@/components/auth/protected-route";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f7f8fc]">
        <div className="flex">
          <VendorSidebar />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
