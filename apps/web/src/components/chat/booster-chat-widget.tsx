"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getCustomerToken, getToken as getVendorToken } from "@/lib/auth";
import { getAdminToken } from "@/lib/admin-auth";
import { API_URL } from "@/lib/api";

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type ProductCardData = {
  id: number;
  title: string;
  price: string;
  sale_price?: string | null;
  image_url?: string | null;
  store_name?: string;
};

function getUserRole() {
  if (typeof window === "undefined") return "guest";
  if (getAdminToken()) return "admin";
  if (getVendorToken()) return "vendor";
  if (getCustomerToken()) return "customer";
  return "guest";
}

function getRoleToken(role: string) {
  if (role === "admin") return getAdminToken();
  if (role === "vendor") return getVendorToken();
  if (role === "customer") return getCustomerToken();
  return null;
}

function extractProductIds(text: string) {
  const matches = text.match(/\/products\/(\d+)/g) || [];

  return Array.from(
    new Set(matches.map((match) => Number(match.replace("/products/", ""))))
  );
}

function ProductChatCard({ productId }: { productId: number }) {
  const [product, setProduct] = useState<ProductCardData | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`${API_URL}/api/public/products/${productId}`, {
          cache: "no-store",
        });

        const data = await res.json();
        setProduct(data.product || null);
      } catch {
        setProduct(null);
      }
    }

    loadProduct();
  }, [productId]);

  if (!product) return null;

  const price = product.sale_price || product.price;

  return (
    <a
      href={`/products/${product.id}`}
      className="mt-3 block overflow-hidden rounded-2xl border border-[#e6eaf2] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex gap-3 p-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#eef2f7]">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-[#94a3b8]">
              No img
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-black text-[#0b1220]">
            {product.title}
          </p>

          {product.store_name ? (
            <p className="mt-1 truncate text-xs font-semibold text-[#0d5b82]">
              {product.store_name}
            </p>
          ) : null}

          <p className="mt-2 text-sm font-black text-[#0d5b82]">€ {price}</p>

          <p className="mt-1 text-xs font-bold text-[#667085]">
            Vedi prodotto →
          </p>
        </div>
      </div>
    </a>
  );
}

export default function BoosterChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Ciao, sono Booster Assistant. Posso aiutarti a usare il portale e, quando possibile, anche a leggere i dati della tua area.",
    },
  ]);

  const bodyRef = useRef<HTMLDivElement | null>(null);
  const role = useMemo(() => getUserRole(), [open]);

  const suggestions = useMemo(() => {
    if (role === "vendor") {
      return [
        "Quanti prodotti ho?",
        "Quanti ordini ho?",
        "Come pubblico un prodotto?",
      ];
    }

    if (role === "customer") {
      return [
        "Quanti ordini ho?",
        "Qual è il mio ultimo ordine?",
        "Come cambio indirizzo?",
      ];
    }

    if (role === "admin") {
      return [
        "Quanti clienti ci sono?",
        "Quanti ordini totali ci sono?",
        "Quanti prodotti pubblicati ci sono?",
      ];
    }

    return [
      "Che prodotti avete?",
      "Avete moto disponibili?",
      "Come apro un negozio?",
    ];
  }, [role]);

  useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, open, sending]);

  async function sendMessage(text: string) {
    const cleaned = text.trim();
    if (!cleaned || sending) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: "user",
      content: cleaned,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const token = getRoleToken(role);

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: cleaned,
          role,
          pathname,
          history: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore assistente AI");
      }

      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content:
          data.reply || "Non sono riuscito a generare una risposta valida.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant-error`,
          role: "assistant",
          content:
            err.message ||
            "C'è stato un problema temporaneo con Booster Assistant.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-[9999] flex h-16 w-16 items-center justify-center rounded-full bg-[#0d5b82] shadow-[0_12px_30px_rgba(13,91,130,0.25)] transition hover:-translate-y-1 hover:scale-105 hover:bg-[#0a4a6a]"
        aria-label="Apri Booster Assistant"
      >
        <Image
          src="/booster.png"
          alt="Booster"
          width={44}
          height={44}
          className="object-contain"
          unoptimized
        />
      </button>

      {open ? (
        <div className="fixed bottom-24 right-5 z-[9998] flex h-[560px] w-[370px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[30px] border border-[#dfe6f1] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.16)]">
          <div className="bg-[linear-gradient(135deg,#0b1220,#0d5b82)] px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                <Image
                  src="/booster.png"
                  alt="Booster"
                  width={42}
                  height={42}
                  className="object-contain"
                  unoptimized
                />
              </div>

              <div>
                <h3 className="text-lg font-black tracking-[-0.02em]">
                  Booster Assistant
                </h3>
                <p className="text-xs text-sky-100">
                  Supporto intelligente del portale
                </p>
              </div>
            </div>
          </div>

          <div
            ref={bodyRef}
            className="flex-1 space-y-4 overflow-y-auto bg-[#f8fafc] px-4 py-4"
          >
            <div className="flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => sendMessage(item)}
                  className="rounded-full border border-[#dbe2ee] bg-white px-3 py-2 text-xs font-semibold text-[#334155] transition hover:bg-[#f1f5f9]"
                >
                  {item}
                </button>
              ))}
            </div>

            {messages.map((message) => {
              const productIds =
                message.role === "assistant"
                  ? extractProductIds(message.content)
                  : [];

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-[22px] px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-[#0d5b82] text-white"
                        : "border border-[#e6eaf2] bg-white text-[#334155]"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <>
                        <ReactMarkdown
                          components={{
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                className="font-bold text-[#0d5b82] underline"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>

                        {productIds.map((productId) => (
                          <ProductChatCard
                            key={`${message.id}-${productId}`}
                            productId={productId}
                          />
                        ))}
                      </>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              );
            })}

            {sending ? (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-[22px] border border-[#e6eaf2] bg-white px-4 py-3 text-sm text-[#334155]">
                  Sto scrivendo...
                </div>
              </div>
            ) : null}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-[#e6eaf2] bg-white px-4 py-4"
          >
            <div className="flex items-end gap-3">
              <textarea
                placeholder="Scrivi un messaggio..."
                className="min-h-[52px] flex-1 resize-none rounded-[20px] border border-[#dbe2ee] px-4 py-3 text-sm outline-none transition focus:border-[#0d5b82]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
              />

              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="rounded-full bg-[#0d5b82] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0a4a6a] disabled:opacity-50"
              >
                Invia
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}