"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";

const items = [
  { href: "/dashboard", label: "Panoramica" },
  { href: "/dashboard/products", label: "Prodotti" },
  { href: "/dashboard/orders", label: "Ordini" },
  { href: "/dashboard/messages", label: "Chat clienti" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    async function loadChats() {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/vendor/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await res.json();
      setConversations(data.conversations || []);
    }

    loadChats();
    const timer = setInterval(loadChats, 5000);
    return () => clearInterval(timer);
  }, [pathname]);

  const chatsCount = useMemo(() => {
    return conversations.reduce(
      (sum: number, chat: any) => sum + Number(chat.unread_vendor || 0),
      0
    );
  }, [conversations]);

  function handleLogout() {
    removeToken();
    router.push("/login");
  }

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-[#e6eaf2] bg-white px-6 py-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#0d5b82]">
          Clients Booster
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#0b1220]">
          Vendor Space
        </h2>
        <p className="mt-2 text-sm text-[#5b667a]">
          Gestisci catalogo, ordini e crescita del negozio.
        </p>
      </div>

      <nav className="mt-10 space-y-2">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          const isMessages = item.href === "/dashboard/messages";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "border border-[#cfe3ef] bg-[#e6f2f8] text-[#0d5b82]"
                  : "text-[#556074] hover:bg-[#f8fafc]"
              }`}
            >
              <span>{item.label}</span>

              {isMessages && chatsCount > 0 ? (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-black text-white">
                  {chatsCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[28px] border border-[#e6eaf2] bg-[#fbfcff] p-5">
        <p className="text-sm text-[#5b667a]">Piano attuale</p>
        <h3 className="mt-1 text-xl font-bold text-[#0b1220]">Starter</h3>
        <p className="mt-2 text-sm leading-6 text-[#5b667a]">
          Continua a far crescere il catalogo e migliora le performance del tuo
          store.
        </p>

        <button
          onClick={handleLogout}
          className="mt-5 w-full rounded-2xl bg-[#0d5b82] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0a4a6a]"
        >
          Esci
        </button>
      </div>
    </aside>
  );
}