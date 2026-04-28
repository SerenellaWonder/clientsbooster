"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getCustomerToken, removeCustomerToken } from "@/lib/auth";

type SupportTicket = {
  id: number;
  status: string;
};

const links = [
  { href: "/customer/account", label: "Dashboard" },
  { href: "/customer/account/orders", label: "Ordini" },
  { href: "/customer/account/support", label: "Ticket" },
];

export default function CustomerSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    async function loadTickets() {
      try {
        const token = getCustomerToken();
        if (!token) return;

        const res = await fetch(`${API_URL}/api/customers/support/tickets`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const data = await res.json();
        if (!res.ok) return;

        setTickets(data.tickets || []);
      } catch {}
    }

    loadTickets();
  }, [pathname]);

  const openTicketsCount = useMemo(() => {
    return tickets.filter(
      (ticket) =>
        ticket.status === "open" || ticket.status === "in_progress"
    ).length;
  }, [tickets]);

  return (
    <aside className="sticky top-0 flex min-h-screen w-[270px] flex-col border-r border-[#e6eaf2] bg-white px-5 py-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#2f7d4b]">
          Clients Booster
        </p>
        <h2 className="mt-3 text-2xl font-black text-[#0b1220]">
          Customer Area
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#5b667a]">
          Ordini, profilo, indirizzi e supporto in un unico spazio.
        </p>
      </div>

      <nav className="mt-10 space-y-2">
        {links.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);

          const isTicketLink = link.href === "/customer/account/support";

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                active
                  ? "bg-[#2f7d4b] text-white shadow-md !text-white"
                  : "text-[#334155] hover:bg-[#f3f6fb]"
              }`}
            >
              <span className={active ? "!text-white" : ""}>{link.label}</span>

              {isTicketLink && openTicketsCount > 0 ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    active
                      ? "bg-white text-[#2f7d4b]"
                      : "bg-[#2f7d4b] text-white"
                  }`}
                >
                  {openTicketsCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 pt-10">
        <Link
          href="/"
          className="block rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 text-sm font-semibold text-[#1b2435] transition hover:-translate-y-0.5 hover:shadow-sm"
        >
          Marketplace
        </Link>

        <button
          onClick={() => {
            removeCustomerToken();
            router.push("/customer/login");
          }}
          className="block w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 text-left text-sm font-semibold text-[#1b2435] transition hover:-translate-y-0.5 hover:shadow-sm"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}