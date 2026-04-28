"use client";

import { useEffect, useState } from "react";
import InboxList from "./inbox-list";
import ChatPanel from "./chat-panel";
import { API_URL } from "@/lib/api";
import { getCustomerToken } from "@/lib/auth";

export default function InboxWidget() {
  const [open, setOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [badge, setBadge] = useState(0);

  async function loadBadge() {
    const token = getCustomerToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/customers/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await res.json();
      const conversations = data.conversations || [];

      const unread = conversations.reduce(
        (sum: number, item: any) =>
          sum + Number(item.unread_customer || 0),
        0
      );

      setBadge(unread);
    } catch {}
  }

  useEffect(() => {
    loadBadge();

    const timer = setInterval(loadBadge, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    function openVendorChat(event: any) {
      setOpen(true);
      setActiveChat({
        type: "new-vendor",
        productId: event.detail.productId,
      });
    }

    window.addEventListener("open-vendor-chat", openVendorChat);
    return () => window.removeEventListener("open-vendor-chat", openVendorChat);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed right-0 top-1/2 z-50 flex -translate-y-1/2 items-center justify-center rounded-l-2xl bg-[#0d5b82] px-2 py-5 text-white shadow-xl transition hover:bg-[#0a4a6a]"
        aria-label="Apri chat venditori"
      >
        <span className="[writing-mode:vertical-rl] rotate-180 text-xs font-black uppercase tracking-[0.22em]">
          Chat
        </span>

        {badge > 0 ? (
          <span className="absolute -left-2 -top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-black text-white">
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed right-16 top-1/2 z-50 h-[560px] w-[390px] -translate-y-1/2 overflow-hidden rounded-[28px] border border-[#e6eaf2] bg-white shadow-[0_25px_80px_rgba(15,23,42,0.20)]">
          {!activeChat ? (
            <InboxList onOpenChat={setActiveChat} onBadgeChange={setBadge} />
          ) : (
            <ChatPanel
              chat={activeChat}
              onBack={() => {
                setActiveChat(null);
                loadBadge();
              }}
            />
          )}
        </div>
      ) : null}
    </>
  );
}