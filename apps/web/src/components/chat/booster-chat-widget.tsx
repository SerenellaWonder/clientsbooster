"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";

import { getCustomerToken, getToken as getVendorToken } from "@/lib/auth";
import { getAdminToken } from "@/lib/admin-auth";
import { getCart } from "@/lib/cart";
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

type VendorStats = {
  products: number;
  publishedProducts: number;
  orders: number;
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
        const res = await fetch(
          `${API_URL}/api/public/products/${productId}`,
          {
            cache: "no-store",
          }
        );

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

          <p className="mt-2 text-sm font-black text-[#0d5b82]">
            € {price}
          </p>

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

  const [mounted, setMounted] = useState(false);

  const [open, setOpen] = useState(false);

  const [input, setInput] = useState("");

  const [sending, setSending] = useState(false);

  const [coachVisible, setCoachVisible] = useState(true);

  const [coachIndex, setCoachIndex] = useState(0);

  const [cartCount, setCartCount] = useState(0);

  const [vendorStats, setVendorStats] =
    useState<VendorStats | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Ciao 👋 Sono Booster Assistant. Posso aiutarti ad acquistare, vendere, pubblicare prodotti, creare relazioni commerciali e far crescere il tuo business.",
    },
  ]);

  const bodyRef = useRef<HTMLDivElement | null>(null);

  const role = useMemo(
    () => (mounted ? getUserRole() : "guest"),
    [mounted, open]
  );

  const productPageId = useMemo(() => {
    const match = pathname?.match(/^\/products\/(\d+)/);

    return match ? Number(match[1]) : null;
  }, [pathname]);

  const isCheckoutPage = pathname === "/checkout";

  const onboarding = useMemo(() => {
    if (role !== "vendor") return null;

    let progress = 0;

    const tasks = [
      {
        label: "Apri il tuo store",
        done: true,
      },
      {
        label: "Crea il primo prodotto",
        done: (vendorStats?.products || 0) > 0,
      },
      {
        label: "Pubblica un prodotto",
        done: (vendorStats?.publishedProducts || 0) > 0,
      },
      {
        label: "Ricevi il primo ordine",
        done: (vendorStats?.orders || 0) > 0,
      },
    ];

    progress =
      (tasks.filter((t) => t.done).length / tasks.length) * 100;

    return {
      progress,
      tasks,
    };
  }, [role, vendorStats]);

  const suggestions = useMemo(() => {
    if (role === "vendor") {
      return [
        "Come aumento le vendite?",
        "Come collaboro con altri negozi?",
        "Analizza il mio catalogo",
        "Come miglioro i prodotti?",
      ];
    }

    if (role === "customer") {
      return [
        "Suggeriscimi prodotti",
        "Aiutami nel checkout",
        "Trova offerte",
        "Come contatto il venditore?",
      ];
    }

    if (role === "admin") {
      return [
        "Quanti ordini ci sono?",
        "Quanti clienti ci sono?",
        "Mostrami statistiche marketplace",
      ];
    }

    return [
      "Come apro un negozio?",
      "Come funziona il marketplace?",
      "Che prodotti avete?",
    ];
  }, [role]);

  const coachMessages = useMemo(() => {
    if (role === "vendor") {
      return [
        "🚀 Booster ti guida fino alla crescita del negozio.",
        "📦 Pubblica prodotti chiari e con immagini professionali.",
        "🤝 Cerca partnership con altri venditori.",
        "📈 Booster può aiutarti a generare più ordini.",
      ];
    }

    if (role === "customer") {
      return [
        "🛍️ Booster ti aiuta a trovare il prodotto giusto.",
        "🛒 Confronta prodotti e completa facilmente il checkout.",
        "💬 Contatta i venditori direttamente dal marketplace.",
      ];
    }

    return [
      "👋 Benvenuto su Clients Booster.",
      "🚀 Marketplace intelligente per clienti e venditori.",
      "💡 Booster Assistant ti accompagna passo dopo passo.",
    ];
  }, [role]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    try {
      const items = getCart();

      setCartCount(
        items.reduce(
          (sum: number, item: any) =>
            sum + Number(item.quantity || 1),
          0
        )
      );
    } catch {
      setCartCount(0);
    }
  }, [mounted, pathname, open]);

  useEffect(() => {
    if (!mounted || role !== "vendor") return;

    async function loadVendorStats() {
      const token = getVendorToken();

      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/api/vendor/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const data = await res.json();

        setVendorStats(data.stats || null);
      } catch {
        setVendorStats(null);
      }
    }

    loadVendorStats();
  }, [mounted, role, open]);

  useEffect(() => {
    if (
      !mounted ||
      !coachVisible ||
      open ||
      coachMessages.length === 0
    )
      return;

    const interval = setInterval(() => {
      setCoachIndex(
        (prev) => (prev + 1) % coachMessages.length
      );
    }, 6000);

    return () => clearInterval(interval);
  }, [mounted, coachVisible, open, coachMessages]);

  useEffect(() => {
    if (!bodyRef.current) return;

    bodyRef.current.scrollTop =
      bodyRef.current.scrollHeight;
  }, [messages, sending, open]);

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

    setCoachVisible(false);

    try {
      const token = getRoleToken(role);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
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
        throw new Error(
          data.error || "Errore assistente AI"
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content:
            data.reply ||
            "Non sono riuscito a generare una risposta.",
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant-error`,
          role: "assistant",
          content:
            err.message ||
            "Problema temporaneo Booster Assistant.",
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
      {mounted && !open && coachVisible ? (
  <div className="fixed bottom-24 right-5 z-[9999] max-w-[240px]">
    <div className="relative rounded-[26px] border border-[#dfe6f1] bg-white px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
      <button
        type="button"
        onClick={() => setCoachVisible(false)}
        className="absolute right-2 top-1.5 text-xs font-bold text-[#94a3b8]"
        aria-label="Nascondi suggerimento"
      >
        ✕
      </button>

      <p className="pr-4 text-xs font-bold leading-5 text-[#0b1220]">
        {coachMessages[coachIndex]}
      </p>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-[11px] font-black text-[#0d5b82]"
      >
        Apri Booster →
      </button>

      <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 border-b border-r border-[#dfe6f1] bg-white" />
    </div>
  </div>
) : null}

      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setCoachVisible(false);
        }}
        className="fixed bottom-5 right-5 z-[9999] flex h-16 w-16 items-center justify-center rounded-full bg-[#0d5b82] shadow-[0_12px_30px_rgba(13,91,130,0.25)] transition hover:scale-105"
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
        <div className="fixed bottom-24 right-5 z-[9998] flex h-[640px] w-[390px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[30px] border border-[#dfe6f1] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.16)]">
          <div className="bg-[linear-gradient(135deg,#0b1220,#0d5b82)] px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                <Image
                  src="/booster.png"
                  alt="Booster"
                  width={42}
                  height={42}
                  unoptimized
                />
              </div>

              <div>
                <h3 className="text-lg font-black">
                  Booster Assistant
                </h3>

                <p className="text-xs text-sky-100">
                  AI Marketplace Coach
                </p>
              </div>
            </div>
          </div>

          {role === "vendor" && onboarding ? (
            <div className="border-b border-[#e6edf5] bg-[#f8fbff] p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#0d5b82]">
                  Mission Control
                </p>

                <p className="text-xs font-black text-[#0b1220]">
                  {Math.round(onboarding.progress)}%
                </p>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-[#dbe7f2]">
                <div
                  className="h-full rounded-full bg-[#0d5b82]"
                  style={{
                    width: `${onboarding.progress}%`,
                  }}
                />
              </div>

              <div className="mt-3 space-y-2">
                {onboarding.tasks.map((task) => (
                  <div
                    key={task.label}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span>
                      {task.done ? "✅" : "⬜"}
                    </span>

                    <span className="font-semibold text-[#334155]">
                      {task.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  href="/dashboard/products/new"
                  className="rounded-full bg-[#0d5b82] px-3 py-2 text-xs font-black text-white"
                >
                  Nuovo prodotto
                </Link>

                <Link
                  href="/dashboard/products"
                  className="rounded-full border border-[#dbe2ee] px-3 py-2 text-xs font-black text-[#334155]"
                >
                  Catalogo
                </Link>
              </div>
            </div>
          ) : null}

          <div
            ref={bodyRef}
            className="flex-1 space-y-4 overflow-y-auto bg-[#f8fafc] px-4 py-4"
          >
            <div className="rounded-[22px] border border-[#dbe7f2] bg-white p-3">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.15em] text-[#0d5b82]">
                Suggerimenti intelligenti
              </p>

              <div className="flex flex-wrap gap-2">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    onClick={() => sendMessage(item)}
                    className="rounded-full border border-[#dbe2ee] bg-white px-3 py-2 text-xs font-semibold text-[#334155]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {role === "customer" && cartCount > 0 ? (
              <div className="rounded-[22px] border border-[#dbe7f2] bg-white p-4">
                <p className="text-sm font-black text-[#0b1220]">
                  🛒 Hai {cartCount} prodotti nel carrello
                </p>

                <p className="mt-1 text-xs text-[#64748b]">
                  Booster può aiutarti a completare
                  rapidamente il checkout.
                </p>

                {!isCheckoutPage ? (
                  <Link
                    href="/checkout"
                    className="mt-3 inline-flex rounded-full bg-[#0d5b82] px-4 py-2 text-xs font-black text-white"
                  >
                    Vai al checkout
                  </Link>
                ) : null}
              </div>
            ) : null}

            {messages.map((message) => {
              const productIds =
                message.role === "assistant"
                  ? extractProductIds(message.content)
                  : [];

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user"
                      ? "justify-end"
                      : "justify-start"
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
                            a: ({
                              href,
                              children,
                            }) => (
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
                <div className="rounded-[22px] border border-[#e6eaf2] bg-white px-4 py-3 text-sm text-[#334155]">
                  Booster sta scrivendo...
                </div>
              </div>
            ) : null}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-[#e6eaf2] bg-white p-4"
          >
            <div className="flex items-end gap-3">
              <textarea
                placeholder="Scrivi un messaggio..."
                value={input}
                onChange={(e) =>
                  setInput(e.target.value)
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                className="min-h-[52px] flex-1 resize-none rounded-[20px] border border-[#dbe2ee] px-4 py-3 text-sm outline-none focus:border-[#0d5b82]"
              />

              <button
                type="submit"
                disabled={
                  sending || !input.trim()
                }
                className="rounded-full bg-[#0d5b82] px-5 py-3 text-sm font-black text-white disabled:opacity-50"
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