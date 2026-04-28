"use client";

import { ChevronRight, Store, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCustomerToken } from "@/lib/auth";

type Conversation = {
  id: number;
  product_title?: string;
  store_name?: string;
  last_message?: string;
  unread_customer?: number;
  last_message_sender?: "customer" | "vendor";
};

export default function InboxList({ onOpenChat, onBadgeChange }: any) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    const token = getCustomerToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/customers/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      const list = data.conversations || [];

      setConversations(list);

      const unread = list.reduce(
        (sum: number, c: Conversation) => sum + Number(c.unread_customer || 0),
        0
      );

      onBadgeChange?.(unread);
    } finally {
      setLoading(false);
    }
  }

  async function deleteConversation(id: number) {
    const ok = window.confirm("Eliminare questa conversazione?");
    if (!ok) return;

    const token = getCustomerToken();
    if (!token) return;

    setDeletingId(id);

    setTimeout(async () => {
      await fetch(`${API_URL}/api/customers/conversations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setDeletingId(null);
      load();
    }, 260);
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full bg-white">
      <div className="bg-[#0d5b82] px-5 py-4 text-white">
        <p className="text-sm font-black">Messaggi venditori</p>
        <p className="mt-1 text-xs text-white/75">
          Conversazioni con i negozi
        </p>
      </div>

      <div className="max-h-[520px] space-y-2 overflow-y-auto bg-[#f7f8fc] p-3">
        {loading ? (
          <div className="rounded-2xl bg-white px-5 py-6 text-sm text-[#667085]">
            Caricamento...
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-2xl bg-white px-5 py-6 text-sm leading-6 text-[#667085]">
            Non hai ancora conversazioni con venditori.
          </div>
        ) : (
          conversations.map((c) => {
            const isDeleting = deletingId === c.id;
            const vendorReplied = c.last_message_sender === "vendor";

            return (
              <div
                key={c.id}
                className={`group flex items-center gap-3 rounded-2xl border border-[#e6eaf2] bg-white px-3 py-3 shadow-sm transition-all duration-300 ${
                  isDeleting
                    ? "translate-x-8 scale-95 opacity-0"
                    : "translate-x-0 scale-100 opacity-100 hover:-translate-y-0.5 hover:shadow-md"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onOpenChat({ type: "vendor", data: c })}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  disabled={isDeleting}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e6f2f8] text-[#0d5b82]">
                    <Store size={19} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="block truncate text-sm font-black text-[#0b1220]">
                        {c.product_title || "Conversazione venditore"}
                      </span>

                      {Number(c.unread_customer || 0) > 0 ? (
                        <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">
                          {c.unread_customer}
                        </span>
                      ) : null}
                    </span>

                    <span className="block truncate text-xs font-semibold text-[#0d5b82]">
                      {c.store_name || "Venditore"}
                    </span>

                    <span className="mt-2 flex items-center gap-2 text-xs">
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 font-bold ${
                          vendorReplied
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-[#e6f2f8] text-[#0d5b82]"
                        }`}
                      >
                        {vendorReplied ? "Venditore ha risposto" : "In attesa"}
                      </span>

                      <span className="truncate text-[#667085]">
                        {c.last_message || "Nessun messaggio"}
                      </span>
                    </span>
                  </span>

                  <ChevronRight size={18} className="shrink-0 text-[#94a3b8]" />
                </button>

                <button
                  type="button"
                  onClick={() => deleteConversation(c.id)}
                  disabled={isDeleting}
                  className="rounded-full bg-[#f8fafc] p-2 text-[#94a3b8] transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  title="Elimina conversazione"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}