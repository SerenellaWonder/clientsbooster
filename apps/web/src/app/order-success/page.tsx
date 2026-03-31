import Link from "next/link";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const params = await searchParams;
  const orderId = params.order_id;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
          Ordine confermato
        </p>

        <h1 className="mt-4 text-4xl font-bold">Grazie per il tuo acquisto</h1>

        <p className="mt-4 text-slate-300">
          Il tuo ordine è stato registrato correttamente.
        </p>

        {orderId ? (
          <p className="mt-4 text-lg text-white">
            Numero ordine: <span className="font-semibold">#{orderId}</span>
          </p>
        ) : null}

        <div className="mt-8 flex justify-center gap-4">
          <Link href="/" className="rounded-xl bg-white px-6 py-3 text-black">
            Torna al marketplace
          </Link>

          <Link href="/cart" className="rounded-xl border px-6 py-3 text-white">
            Vai al carrello
          </Link>
        </div>
      </div>
    </main>
  );
}