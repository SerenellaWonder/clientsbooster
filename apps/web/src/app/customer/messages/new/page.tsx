"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { API_URL } from "@/lib/api";
import { getCustomerToken } from "@/lib/auth";

export default function NewConversationPage() {
  const params = useSearchParams();
  const router = useRouter();

  const productId = params.get("product_id");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    if (!message.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/customers/conversations`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getCustomerToken()}`,
  },
  body: JSON.stringify({
    product_id: Number(productId),
    message,
  }),
});

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore invio messaggio");
      }

      // 🔥 redirect alla chat appena creata
      router.push(`/customer/messages/${data.conversation.id}`);
    } catch (err: any) {
      setError(err.message || "Errore invio messaggio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="rounded-[28px] border border-[#e6eaf2] bg-white p-6 shadow-sm">
          
          <h1 className="text-2xl font-black text-[#0b1220]">
            Contatta il venditore
          </h1>

          <p className="mt-2 text-sm text-[#5b667a]">
            Scrivi un messaggio per chiedere informazioni sul prodotto.
          </p>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Scrivi qui il tuo messaggio..."
            className="mt-6 w-full rounded-2xl border border-[#dbe2ee] px-4 py-3 outline-none focus:ring-2 focus:ring-[#2f7d4b]"
            rows={5}
          />

          <button
            onClick={handleSend}
            disabled={loading}
            className="mt-6 w-full rounded-full bg-[#2f7d4b] py-3 text-sm font-bold text-white transition hover:opacity-95 disabled:opacity-50"
          >
            {loading ? "Invio..." : "Invia messaggio"}
          </button>
        </div>
      </div>
    </main>
  );
}