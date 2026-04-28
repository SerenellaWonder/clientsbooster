"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";

type SupportTicket = {
  id: number;
  status: string;
};

type Conversation = {
  id: number;
};

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/products", label: "Prodotti" },
  { href: "/dashboard/orders", label: "Ordini" },
  { href: "/dashboard/messages", label: "Chat clienti" },
  { href: "/dashboard/support", label: "Ticket" },
];

const VENDOR_PRIMARY = "#25b7f3";
const VENDOR_HOVER = "#eef9fe";

export default function VendorSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const token = getToken();
        if (!token) return;

        const [ticketsRes, chatsRes] = await Promise.all([
          fetch(`${API_URL}/api/vendor/support/tickets`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
          fetch(`${API_URL}/api/vendor/conversations`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }),
        ]);

        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          setTickets(ticketsData.tickets || []);
        }

        if (chatsRes.ok) {
          const chatsData = await chatsRes.json();
          setConversations(chatsData.conversations || []);
        }
      } catch {}
    }

    loadData();
  }, [pathname]);

  const openTicketsCount = useMemo(() => {
    return tickets.filter(
      (ticket) =>
        ticket.status === "open" || ticket.status === "in_progress"
    ).length;
  }, [tickets]);

  const chatsCount = useMemo(() => {
  return conversations.reduce(
    (sum: number, chat: any) => sum + Number(chat.unread_vendor || 0),
    0
  );
}, [conversations]);

  return (
    <aside className="sticky top-0 flex min-h-screen w-[270px] flex-col border-r border-[#e6eaf2] bg-white px-5 py-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#25b7f3]">
          Clients Booster
        </p>
        <h2 className="mt-3 text-2xl font-black text-[#0b1220]">
          Vendor Panel
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#5b667a]">
          Gestione completa del tuo negozio, ordini, catalogo e supporto.
        </p>
      </div>

      <nav className="mt-10 space-y-2">
        {links.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);

          const isTicketLink = link.href === "/dashboard/support";
          const isChatLink = link.href === "/dashboard/messages";

          const badgeValue = isTicketLink
            ? openTicketsCount
            : isChatLink
              ? chatsCount
              : 0;

          return (
            <Link
              key={link.href}
              href={link.href}
              style={
                active
                  ? { backgroundColor: VENDOR_PRIMARY, color: "#ffffff" }
                  : undefined
              }
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                active ? "shadow-md !text-white" : "text-[#334155]"
              }`}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = VENDOR_HOVER;
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <span className={active ? "!text-white" : ""}>{link.label}</span>

              {badgeValue > 0 ? (
                <span
                  style={
                    active
                      ? { backgroundColor: "#ffffff", color: VENDOR_PRIMARY }
                      : { backgroundColor: VENDOR_PRIMARY, color: "#ffffff" }
                  }
                  className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                >
                  {badgeValue}
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
            removeToken();
            router.push("/login");
          }}
          className="block w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 text-left text-sm font-semibold text-[#1b2435] transition hover:-translate-y-0.5 hover:shadow-sm"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}