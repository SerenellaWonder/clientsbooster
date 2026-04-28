"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCustomerToken } from "@/lib/auth";

const PRIMARY = "#0d5b82";

export default function ChatPanel({ chat, onBack }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState(chat?.data?.id || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadConversation(id: number) {
    const res = await fetch(`${API_URL}/api/customers/conversations/${id}`, {
      headers: {
        Authorization: `Bearer ${getCustomerToken()}`,
      },
    });

    const data = await res.json();

    if (res.ok) {
      setMessages(data.messages || []);
      setConversationId(id);
    }
  }

  useEffect(() => {
    if (chat?.type === "vendor" && chat?.data?.id) {
      loadConversation(chat.data.id);
    }
  }, [chat]);

  async function sendMessage() {
    if (!message.trim()) return;

    setLoading(true);
    setError("");

    try {
      let res;

      if (chat.type === "new-vendor") {
        res = await fetch(`${API_URL}/api/customers/conversations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getCustomerToken()}`,
          },
          body: JSON.stringify({
            product_id: Number(chat.productId),
            message,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Errore invio messaggio");
        }

        setConversationId(data.conversation.id);
        await loadConversation(data.conversation.id);
      }

      if (chat.type === "vendor" && conversationId) {
        res = await fetch(
          `${API_URL}/api/customers/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getCustomerToken()}`,
            },
            body: JSON.stringify({ message }),
          }
        );

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Errore invio messaggio");
        }

        await loadConversation(conversationId);
      }

      setMessage("");
    } catch (err: any) {
      setError(err.message || "Errore invio messaggio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[560px] flex-col">
      <div
        className="flex items-center gap-3 px-4 py-4 text-white"
        style={{ backgroundColor: PRIMARY }}
      >
        <button onClick={onBack} className="text-lg font-bold">
          ←
        </button>

        <div>
          <p className="text-sm font-black">
            {chat?.data?.product_title || "Messaggi venditore"}
          </p>
          <p className="text-xs text-white/80">
            Storico conversazione
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f8fc] p-4">
        {messages.length === 0 ? (
          <p className="text-sm leading-6 text-[#667085]">
            Scrivi un messaggio al venditore. La risposta potrebbe non essere immediata.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_type === "customer";

            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    mine
                      ? "text-white"
                      : "bg-white text-[#0b1220] border border-[#e6eaf2]"
                  }`}
                  style={mine ? { backgroundColor: PRIMARY } : undefined}
                >
                  {m.message}
                </div>
              </div>
            );
          })
        )}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </div>

      <div className="border-t border-[#eef2f7] bg-white p-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Scrivi il tuo messaggio..."
          rows={2}
          className="w-full resize-none rounded-2xl border border-[#dbe2ee] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0d5b82]"
        />

        <button
          onClick={sendMessage}
          disabled={loading || !message.trim()}
          className="mt-3 w-full rounded-full px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: PRIMARY }}
        >
          {loading ? "Invio..." : "Invia"}
        </button>
      </div>
    </div>
  );
}