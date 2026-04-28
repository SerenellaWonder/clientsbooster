"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { removeAdminToken } from "@/lib/admin-auth";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/vendors", label: "Venditori" },
  { href: "/admin/customers", label: "Clienti" },
  { href: "/admin/orders", label: "Ordini" },
  { href: "/admin/support", label: "Ticket" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="sticky top-0 flex min-h-screen w-[260px] flex-col border-r border-[#e6eaf2] bg-white px-5 py-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#0d5b82]">
          Clients Booster
        </p>
        <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#0b1220]">
          Admin
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#5b667a]">
          Controllo completo della piattaforma.
        </p>
      </div>

      <nav className="mt-8 space-y-2">
        {links.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-[#0d5b82]"
                  : "text-[#334155] hover:bg-[#f3f6fb] hover:text-[#0b1220]"
              }`}
            >
              <span className={active ? "!text-white" : ""}>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 pt-8">
        <Link
          href="/"
          className="block rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 text-sm font-semibold text-[#1b2435] transition hover:-translate-y-0.5 hover:shadow-sm"
        >
          Marketplace
        </Link>

        <button
          onClick={() => {
            removeAdminToken();
            router.push("/admin/login");
          }}
          className="block w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 text-left text-sm font-semibold text-[#1b2435] transition hover:-translate-y-0.5 hover:shadow-sm"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}