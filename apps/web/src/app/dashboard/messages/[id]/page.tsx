"use client";

import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Message = {
  id: number;
  message: string;
  sender_type: "customer" | "vendor";
  created_at: string;
};

export default function VendorChatDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadChat() {
    if (!id) return;

    const res = await fetch(`${API_URL}/api/vendor/conversations/${id}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      cache: "no-store",
    });

    const data = await res.json();
    setConversation(data.conversation || null);
    setMessages(data.messages || []);
  }

  async function sendMessage() {
    if (!text.trim()) return;

    setLoading(true);

    await fetch(`${API_URL}/api/vendor/conversations/${id}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ message: text }),
    });

    setText("");
    setLoading(false);
    loadChat();
  }

  useEffect(() => {
    loadChat();

    const timer = setInterval(loadChat, 2000);
    return () => clearInterval(timer);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <main className="min-h-screen bg-[#f7f8fc] p-6 text-[#0b1220]">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard/messages"
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dbe2ee] bg-white px-4 py-2 text-sm font-bold text-[#0d5b82] transition hover:-translate-y-0.5 hover:shadow-sm"
        >
          <ArrowLeft size={16} />
          Torna alle chat
        </Link>

        <section className="overflow-hidden rounded-[36px] border border-[#e6eaf2] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-4 bg-[#0d5b82] px-6 py-5 text-white">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">
                Conversazione cliente
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                {conversation?.customer_name ||
                  conversation?.customer_email ||
                  "Cliente"}
              </h1>
              <p className="mt-1 text-sm text-white/75">
                Prodotto: {conversation?.product_title || "Non specificato"}
              </p>
            </div>

            <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold">
              Rispondi dal pannello venditore
            </span>
          </div>

          <div className="h-[560px] overflow-y-auto bg-[#eef3f8] px-5 py-6">
            {messages.length === 0 ? (
              <div className="mx-auto max-w-md rounded-3xl border border-[#e6eaf2] bg-white p-6 text-center text-sm leading-6 text-[#667085] shadow-sm">
                Nessun messaggio ancora.
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m) => {
                  const mine = m.sender_type === "vendor";

                  return (
                    <div
                      key={m.id}
                      className={`flex ${
                        mine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[72%] rounded-[24px] px-4 py-3 text-sm leading-6 shadow-sm ${
                          mine
                            ? "rounded-br-md bg-[#0d5b82] text-white"
                            : "rounded-bl-md border border-[#e6eaf2] bg-white text-[#0b1220]"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {m.message}
                        </p>

                        <div
                          className={`mt-2 flex items-center justify-end gap-1 text-[10px] ${
                            mine ? "text-white/65" : "text-[#94a3b8]"
                          }`}
                        >
                          <span>
                            {new Date(m.created_at).toLocaleTimeString(
                              "it-IT",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>

                          {mine ? <span className="font-bold">✓✓</span> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-[#e6eaf2] bg-white p-5">
            <div className="flex items-end gap-3 rounded-[28px] border border-[#dbe2ee] bg-[#fbfcff] p-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Scrivi una risposta al cliente..."
                rows={2}
                className="min-h-[48px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
              />

              <button
                onClick={sendMessage}
                disabled={loading || !text.trim()}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0d5b82] text-white transition hover:bg-[#0a4a6a] disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>

            <p className="mt-3 text-center text-xs text-[#8a94a6]">
              Premi Invio per inviare · Shift + Invio per andare a capo
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}