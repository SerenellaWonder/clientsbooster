"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { order_id?: string };
}) {
  const orderId = searchParams?.order_id;

  useEffect(() => {
    // piccolo effetto UX: scroll top
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-6 py-12 text-[#0b1220]">
      <div className="mx-auto max-w-4xl">

        {/* HEADER */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl">
            ✅
          </div>

          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#0d5b82]">
            Ordine completato
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-[-0.04em]">
            Grazie per il tuo acquisto
          </h1>

          <p className="mt-4 text-[#5b667a] max-w-xl mx-auto">
            Il tuo ordine è stato confermato. Riceverai aggiornamenti via email.
          </p>
        </div>

        {/* CARD PRINCIPALE */}
        <div className="card-ui p-8 text-center">

          {orderId && (
            <div className="mb-6">
              <p className="text-sm text-[#5b667a]">Numero ordine</p>
              <p className="text-2xl font-black mt-1">#{orderId}</p>
            </div>
          )}

          {/* STATUS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

            <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
              <p className="text-xs text-[#8a94a6]">Pagamento</p>
              <p className="font-bold text-green-600 mt-1">Completato</p>
            </div>

            <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
              <p className="text-xs text-[#8a94a6]">Stato ordine</p>
              <p className="font-bold mt-1">In elaborazione</p>
            </div>

            <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
              <p className="text-xs text-[#8a94a6]">Spedizione</p>
              <p className="font-bold mt-1">In preparazione</p>
            </div>

          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">

            <Link
              href="/"
              className="rounded-full bg-[#0d5b82] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0a4a6a]"
            >
              Torna al marketplace
            </Link>

            <Link
              href="/customer/account/orders"
              className="rounded-full border border-[#dbe2ee] bg-white px-6 py-3 text-sm font-semibold text-[#152033] transition hover:shadow-sm"
            >
              I miei ordini
            </Link>

          </div>

        </div>

        {/* INFO EXTRA */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">

          <div className="card-ui p-6">
            <h3 className="font-bold text-lg mb-2">Cosa succede ora?</h3>
            <ul className="text-sm text-[#5b667a] space-y-2">
              <li>• Il venditore sta preparando il tuo ordine</li>
              <li>• Riceverai aggiornamenti via email</li>
              <li>• Potrai tracciare lo stato dal tuo account</li>
            </ul>
          </div>

          <div className="card-ui p-6">
            <h3 className="font-bold text-lg mb-2">Serve aiuto?</h3>
            <p className="text-sm text-[#5b667a] mb-3">
              Il nostro supporto è sempre disponibile.
            </p>

            <Link
              href="/customer/account/support"
              className="text-[#0d5b82] font-semibold text-sm hover:underline"
            >
              Contatta il supporto →
            </Link>
          </div>

        </div>

      </div>
    </main>
  );
}