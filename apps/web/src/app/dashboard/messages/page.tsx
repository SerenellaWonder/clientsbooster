"use client";

import Link from "next/link";
import { MessageCircle, Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Conversation = {
  id: number;
  customer_name?: string;
  customer_email?: string;
  product_title?: string;
  last_message?: string;
  unread_vendor?: number;
  updated_at?: string;
};

export default function VendorMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadConversations() {
    try {
      const res = await fetch(`${API_URL}/api/vendor/conversations`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        cache: "no-store",
      });

      const data = await res.json();
      setConversations(data.conversations || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConversations();

    const timer = setInterval(loadConversations, 5000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = useMemo(() => {
    return conversations.reduce(
      (sum, item) => sum + Number(item.unread_vendor || 0),
      0
    );
  }, [conversations]);

  return (
    <main className="min-h-screen bg-[#f7f8fc] p-6 text-[#0b1220]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#0d5b82]">
              Messaggi
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.04em]">
              Chat clienti
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085]">
              Qui trovi le conversazioni aperte dai clienti sui tuoi prodotti.
            </p>
          </div>

          <div className="rounded-full border border-[#dbe2ee] bg-white px-5 py-2 text-sm font-bold text-[#0d5b82] shadow-sm">
            {unreadCount} nuovi messaggi
          </div>
        </div>

        {loading ? (
          <div className="rounded-[28px] border border-[#e6eaf2] bg-white p-8 text-[#667085] shadow-sm">
            Caricamento conversazioni...
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-[28px] border border-[#e6eaf2] bg-white p-8 text-[#667085] shadow-sm">
            Nessuna conversazione al momento.
          </div>
        ) : (
          <div className="grid gap-4">
            {conversations.map((chat) => {
              const unread = Number(chat.unread_vendor || 0);

              return (
                <Link
                  key={chat.id}
                  href={`/dashboard/messages/${chat.id}`}
                  className="group rounded-[28px] border border-[#e6eaf2] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#e6f2f8] text-[#0d5b82]">
                      <MessageCircle size={24} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-black tracking-[-0.03em]">
                          {chat.customer_name ||
                            chat.customer_email ||
                            "Cliente"}
                        </h2>

                        {unread > 0 ? (
                          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-black text-white">
                            {unread} nuovo
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#0d5b82]">
                        <Store size={15} />
                        <span className="truncate">
                          {chat.product_title || "Prodotto non specificato"}
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-1 text-sm text-[#667085]">
                        {chat.last_message || "Nessun messaggio"}
                      </p>
                    </div>

                    <div className="hidden text-right sm:block">
                      <span className="rounded-full border border-[#dbe2ee] bg-white px-4 py-2 text-xs font-bold text-[#0d5b82] transition group-hover:bg-[#0d5b82] group-hover:text-white">
                        Apri chat
                      </span>

                      {chat.updated_at ? (
                        <p className="mt-2 text-xs text-[#94a3b8]">
                          {new Date(chat.updated_at).toLocaleDateString(
                            "it-IT"
                          )}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}