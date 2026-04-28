import CustomerSidebar from "@/components/customer/sidebar";

export default function CustomerAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <div className="flex">
        <CustomerSidebar />
        <main className="flex-1 p-8 text-[#0b1220]">{children}</main>
      </div>
    </div>
  );
}