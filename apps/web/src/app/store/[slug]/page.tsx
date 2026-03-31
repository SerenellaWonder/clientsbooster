import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type Store = {
  id: number;
  name: string;
  slug: string;
};

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

async function getStore(slug: string): Promise<Store | null> {
  try {
    const res = await fetch(`http://localhost:9000/api/public/stores/${slug}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.store || null;
  } catch {
    return null;
  }
}

async function getStoreProducts(slug: string): Promise<Product[]> {
  try {
    const res = await fetch(
      `http://localhost:9000/api/public/stores/${slug}/products`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [store, products] = await Promise.all([
    getStore(slug),
    getStoreProducts(slug),
  ]);

  if (!store) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_25%),linear-gradient(to_bottom,#020617,#0f172a_35%,#111827_100%)] px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm text-slate-400 transition hover:text-white">
          ← Torna al marketplace
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 shadow-[0_24px_70px_rgba(2,6,23,0.32)] backdrop-blur-xl">
          <div className="relative overflow-hidden px-8 py-12 md:px-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_25%),radial-gradient(circle_at_left,rgba(59,130,246,0.14),transparent_30%)]" />
            <div className="relative">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200/80">
                Store
              </p>
              <h1 className="mt-4 text-4xl font-semibold text-white md:text-5xl">
                {store.name}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
                Uno spazio dedicato per raccontare il catalogo del negozio, dare
                identità al brand e mostrare i prodotti pubblicati nel marketplace.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <div className="rounded-full border border-white/10 bg-white/10 px-5 py-2.5 text-sm text-slate-200">
                  Slug: {store.slug}
                </div>
                <div className="rounded-full border border-white/10 bg-white/10 px-5 py-2.5 text-sm text-slate-200">
                  Prodotti pubblicati: {products.length}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                Catalogo
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                Prodotti del negozio
              </h2>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 text-slate-300 backdrop-blur">
              Nessun prodotto pubblicato per questo negozio.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_18px_45px_rgba(2,6,23,0.24)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/[0.07]"
                >
                  <Link href={`/products/${product.id}`} className="block">
                    <div className="relative h-60 w-full overflow-hidden bg-slate-900/70">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.title}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-[1.04]"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">
                          Nessuna immagine
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/80 to-transparent" />
                    </div>
                  </Link>

                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-2xl font-semibold text-white">
                        {product.title}
                      </h3>

                      {product.category ? (
                        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-200">
                          {product.category}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">
                      {product.description || "Nessuna descrizione"}
                    </p>

                    {product.tags ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {product.tags
                          .split(",")
                          .slice(0, 3)
                          .map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                      </div>
                    ) : null}

                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {product.sale_price ? (
                          <>
                            <span className="text-xl font-semibold text-white">
                              € {product.sale_price}
                            </span>
                            <span className="text-sm text-slate-500 line-through">
                              € {product.price}
                            </span>
                          </>
                        ) : (
                          <span className="text-xl font-semibold text-white">
                            € {product.price}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/products/${product.id}`}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                      >
                        Dettagli
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}