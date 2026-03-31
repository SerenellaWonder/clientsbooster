import Link from "next/link";

type Product = {
  id: number;
  title: string;
  description: string;
  price: string;
  store_name: string;
  store_slug: string;
  image_url?: string | null;
  category?: string | null;
  tags?: string | null;
  sale_price?: string | null;
};

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch("http://localhost:9000/api/public/products", {
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const products = await getProducts();

  const storeMap = new Map<string, { name: string; slug: string; products: number }>();

  for (const product of products) {
    const existing = storeMap.get(product.store_slug);
    if (existing) {
      existing.products += 1;
    } else {
      storeMap.set(product.store_slug, {
        name: product.store_name,
        slug: product.store_slug,
        products: 1,
      });
    }
  }

  const stores = Array.from(storeMap.values());
  const featuredProducts = products.slice(0, 12);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.15),transparent_30%),linear-gradient(to_bottom,#020617,#0f172a_35%,#111827_100%)] text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/80">
              Clients Booster
            </p>
            <h1 className="mt-1 text-lg font-semibold text-white">
              Marketplace premium per far crescere il tuo business
            </h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/cart"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/10"
            >
              Carrello
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/10"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90"
            >
              Apri il tuo negozio
            </Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Clients Booster
            </div>

            <h2 className="mt-8 max-w-4xl text-5xl font-semibold leading-tight text-white md:text-6xl">
              Fai crescere il tuo negozio con{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-white bg-clip-text text-transparent">
                Clients Booster
              </span>
            </h2>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300">
              Una piattaforma moderna per venditori indipendenti: catalogo avanzato,
              immagini, CSV, store pubblici, ordini e dashboard professionale in un
              unico ecosistema.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_10px_40px_rgba(255,255,255,0.12)] transition hover:opacity-90"
              >
                Inizia a vendere con Clients Booster
              </Link>

              <Link
                href="/login"
                className="rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                Accedi alla dashboard
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_25px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl">
              <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/80 p-4">
                <div className="grid gap-4">
                  <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-cyan-400/20 to-sky-500/10 p-6">
                    <p className="text-sm text-cyan-200">Clients Booster</p>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <p className="text-4xl font-semibold text-white">+128%</p>
                        <p className="mt-2 text-sm text-slate-300">
                          Crescita percepita del tuo ecosistema store
                        </p>
                      </div>

                      <div className="h-20 w-24 rounded-2xl bg-white/10" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                      <p className="text-sm text-slate-400">Import massivo</p>
                      <p className="mt-3 text-2xl font-semibold text-white">CSV</p>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                      <p className="text-sm text-slate-400">Ordini</p>
                      <p className="mt-3 text-2xl font-semibold text-white">Live</p>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                    <p className="text-sm text-slate-400">Clients Booster stack</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                        Dashboard
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                        Catalogo
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                        Checkout
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                        Store
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -right-6 top-8 hidden h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl lg:block" />
            <div className="absolute -bottom-8 -left-8 hidden h-36 w-36 rounded-full bg-sky-500/20 blur-3xl lg:block" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
            Piani Clients Booster
          </p>
          <h3 className="mt-3 text-3xl font-semibold text-white">
            Parti semplice, cresci senza cambiare piattaforma
          </h3>
          <p className="mt-3 max-w-2xl text-slate-400">
            Una progressione pensata per accompagnare il venditore dal primo
            catalogo fino a una presenza online più strutturata e professionale.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Starter
            </p>
            <h4 className="mt-3 text-2xl font-semibold text-white">
              Per iniziare subito
            </h4>
            <p className="mt-4 text-slate-300">
              Ideale per chi vuole pubblicare i primi prodotti e testare il mercato
              senza complessità tecniche.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li>• Creazione negozio</li>
              <li>• Dashboard venditore</li>
              <li>• Catalogo base</li>
              <li>• Upload immagini</li>
              <li>• Store pubblico</li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-400/10 p-8 shadow-[0_20px_50px_rgba(34,211,238,0.08)] backdrop-blur">
            <div className="inline-flex rounded-full border border-cyan-300/20 bg-white/10 px-3 py-1 text-xs font-medium text-cyan-100">
              Più scelto
            </div>

            <p className="mt-4 text-sm uppercase tracking-[0.2em] text-cyan-200">
              Growth
            </p>
            <h4 className="mt-3 text-2xl font-semibold text-white">
              Per far crescere le vendite
            </h4>
            <p className="mt-4 text-slate-200">
              Per chi vuole lavorare sul catalogo in modo serio e gestire ordini,
              importazioni, sconti e maggiore organizzazione.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-slate-200">
              <li>• Tutto dello Starter</li>
              <li>• CSV import/export</li>
              <li>• Categorie e tag</li>
              <li>• Prezzi scontati e stock</li>
              <li>• Gestione ordini</li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Pro
            </p>
            <h4 className="mt-3 text-2xl font-semibold text-white">
              Per un brand più strutturato
            </h4>
            <p className="mt-4 text-slate-300">
              Pensato per chi vuole più controllo, più personalizzazione e una
              presenza ancora più professionale.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li>• Tutto del Growth</li>
              <li>• Funzioni ecommerce evolute</li>
              <li>• Esperienza premium</li>
              <li>• Branding più forte</li>
              <li>• Base per dominio dedicato</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-8 pt-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
              Store attivi
            </p>
            <h3 className="mt-3 text-3xl font-semibold text-white">
              I negozi che stanno costruendo il loro business
            </h3>
            <p className="mt-3 max-w-2xl text-slate-400">
              Ogni store può crescere dentro Clients Booster con il proprio catalogo,
              la propria identità e il proprio percorso commerciale.
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            {stores.length} store attivi
          </div>
        </div>

        {stores.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 text-slate-300 backdrop-blur">
            Nessuno store attivo al momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {stores.map((store) => (
              <Link
                key={store.slug}
                href={`/store/${store.slug}`}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:bg-white/[0.07]"
              >
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">
                  Store
                </p>
                <h4 className="mt-3 text-2xl font-semibold text-white">
                  {store.name}
                </h4>
                <p className="mt-3 text-sm text-slate-400">
                  Slug: {store.slug}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Prodotti pubblicati: {store.products}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
              Prodotti da store selezionati
            </p>
            <h3 className="mt-3 text-3xl font-semibold text-white">
              Una selezione dal marketplace
            </h3>
            <p className="mt-3 max-w-2xl text-slate-400">
              Prodotti in evidenza provenienti da alcuni store presenti su Clients Booster.
            </p>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            {featuredProducts.length} prodotti in evidenza
          </div>
        </div>

      </section>
    </main>
  );
}
