import HeaderActions from "@/components/home/header-actions";
import Image from "next/image";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import Footer from "@/components/home/footer";
import {
  ArrowRight,
  BarChart3,
  FolderKanban,
  LayoutDashboard,
  Rocket,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Upload,
  Zap,
} from "lucide-react";

const ADMIN_PRIMARY = "#0d5b82";
const ADMIN_SOFT = "#e6f2f8";
const VENDOR_PRIMARY = "#25b7f3";
const VENDOR_PRIMARY_DARK = "#1d9bf0";

type Product = {
  id: number;
  title: string;
  description: string;
  price: string;
  store_name: string;
  store_slug: string;
  image_url?: string | null;
  category?: string | null;
  sale_price?: string | null;
};

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_URL}/api/public/products`, {
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

  const storeMap = new Map<
    string,
    { name: string; slug: string; products: number }
  >();

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

  const stores = Array.from(storeMap.values()).slice(0, 6);
  const featuredProducts = products.slice(0, 6);

  return (
    <main className="min-h-screen bg-[#f4f8fc] text-[#0b1220]">
      <header className="sticky top-0 z-30 border-b border-[#e7ebf3] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-8 py-5">
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.38em]"
              style={{ color: ADMIN_PRIMARY }}
            >
              Clients Booster
            </p>
            <p className="mt-1 text-xl font-semibold text-[#0b1220]">
              Marketplace per far crescere il tuo business
            </p>
          </div>

          <HeaderActions />
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,91,130,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.10),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(37,183,243,0.08),transparent_22%)]" />

        <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 gap-16 px-8 pb-20 pt-16 lg:grid-cols-[1.06fr_0.94fr]">
          <div className="pt-6">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold shadow-sm"
              style={{
                borderColor: "#cfe3ef",
                backgroundColor: ADMIN_SOFT,
                color: ADMIN_PRIMARY,
              }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: VENDOR_PRIMARY }}
              />
              Clients Booster
            </div>

            <h1 className="mt-8 max-w-5xl text-6xl font-black leading-[0.98] tracking-[-0.055em] text-[#152033] xl:text-[82px]">
              La piattaforma che trasforma prodotti
              <span className="block" style={{ color: VENDOR_PRIMARY }}>
                in business.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-9 text-[#556074]">
              Vendi online con una struttura moderna, ordinata e credibile.
              Catalogo, ordini, store pubblici e gestione operativa in un unico
              ecosistema pensato per chi vuole crescere davvero.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-3 rounded-full px-8 py-4 text-sm font-semibold !text-white shadow-[0_10px_30px_rgba(37,183,243,0.25)] transition hover:-translate-y-0.5"
                style={{ backgroundColor: VENDOR_PRIMARY }}
              >
                <span className="text-white">Inizia a vendere</span>
                <ArrowRight size={18} className="text-white" />
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center gap-3 rounded-full border border-[#dbe2ee] bg-white px-8 py-4 text-sm font-bold text-[#152033] transition hover:-translate-y-0.5 hover:shadow-sm"
              >
                Accedi alla dashboard
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <StatsCard
                icon={<FolderKanban size={22} />}
                label="Prodotti online"
                value={products.length}
              />
              <StatsCard
                icon={<Store size={22} />}
                label="Store attivi"
                value={storeMap.size}
              />
              <StatsCard
                icon={<Sparkles size={22} />}
                label="Esperienza"
                value="Premium"
              />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-12 hidden h-40 w-40 rounded-full bg-sky-100 blur-3xl lg:block" />
            <div className="absolute -right-6 bottom-8 hidden h-40 w-40 rounded-full bg-cyan-100 blur-3xl lg:block" />

            <div className="relative rounded-[36px] border border-[#e4e9f3] bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
              <div
                className="relative overflow-hidden rounded-[32px] px-8 pb-20 pt-8 text-white shadow-[0_20px_60px_rgba(37,183,243,0.22)]"
                style={{
                  background: `linear-gradient(135deg, ${VENDOR_PRIMARY_DARK}, #8dcdf2)`,
                }}
              >
                <div className="absolute right-6 top-6 h-56 w-56 rounded-full bg-white/10" />
                <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-white/5" />

                <p className="relative z-10 text-sm font-semibold text-sky-50">
                  Clients Booster
                </p>

                <div className="relative z-10 mt-4 max-w-xs">
                  <p className="text-6xl font-black tracking-[-0.05em]">+128%</p>
                  <p className="mt-4 text-base leading-7 text-sky-50">
                    Crescita percepita del tuo ecosistema store e maggiore
                    controllo sulla gestione commerciale.
                  </p>
                </div>

                <div className="absolute right-0 left-70 bottom-0 z-20">
                  <img
                    src="/booster.png"
                    alt="booster"
                    className="h-84 w-84 object-contain drop-shadow-[0_18px_35px_rgba(15,23,42,0.28)]"
                  />
                </div>

                <svg
                  viewBox="0 0 800 180"
                  className="absolute bottom-0 left-0 z-10 h-[92px] w-full"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,120
                       C40,80 90,80 120,110
                       C145,55 220,45 255,100
                       C285,70 350,70 380,105
                       C405,55 470,50 505,98
                       C540,70 610,70 640,108
                       C670,78 730,82 800,112
                       L800,180 L0,180 Z"
                    fill="white"
                    fillOpacity="0.96"
                  />
                </svg>
              </div>

              <div className="-mt-2 grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-[24px] border border-[#e7ebf3] bg-[#fbfcff] p-5 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-[#667085]">Import massivo</p>
                        <p
                          className="mt-3 text-3xl font-black tracking-[-0.03em]"
                          style={{ color: ADMIN_PRIMARY }}
                        >
                          CSV
                        </p>
                      </div>

                      <div
                        className="rounded-[18px] p-3 shadow-sm"
                        style={{
                          backgroundColor: ADMIN_SOFT,
                          color: ADMIN_PRIMARY,
                        }}
                      >
                        <Upload size={20} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-[#e7ebf3] bg-[#fbfcff] p-5 shadow-[0_8px_20px_rgba(15,23,42,0.03)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-[#667085]">Ordini</p>
                        <p
                          className="mt-3 text-3xl font-black tracking-[-0.03em]"
                          style={{ color: ADMIN_PRIMARY }}
                        >
                          Live
                        </p>
                      </div>

                      <div
                        className="rounded-[18px] p-3 shadow-sm"
                        style={{
                          backgroundColor: ADMIN_SOFT,
                          color: ADMIN_PRIMARY,
                        }}
                      >
                        <ShoppingCart size={20} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[26px] border border-[#e7ebf3] bg-[#fbfcff] p-5">
                  <div className="flex items-center gap-2">
                    <div
                      className="rounded-full p-2"
                      style={{
                        backgroundColor: ADMIN_SOFT,
                        color: ADMIN_PRIMARY,
                      }}
                    >
                      <LayoutDashboard size={16} />
                    </div>
                    <p className="text-sm text-[#667085]">Clients Booster stack</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Dashboard", "Catalogo", "Checkout", "Store"].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[#e1e7f1] bg-white px-3 py-1.5 text-xs font-bold text-[#425066]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 rounded-[22px] border border-[#e7ebf3] bg-white p-5">
                    <div className="flex items-center gap-2">
                      <div
                        className="rounded-full p-2"
                        style={{
                          backgroundColor: ADMIN_SOFT,
                          color: ADMIN_PRIMARY,
                        }}
                      >
                        <BarChart3 size={16} />
                      </div>
                      <p className="text-sm text-[#667085]">Store performance</p>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_0.9fr]">
                      <div>
                        <p className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
                          Branding + gestione
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#556074]">
                          Una base più forte per trasformare il catalogo in un
                          business strutturato.
                        </p>
                      </div>

                      <div className="rounded-[18px] border border-[#edf1f7] bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-3">
                        <svg viewBox="0 0 220 110" className="h-24 w-full" fill="none">
                          <path
                            d="M10 85 C40 55, 70 78, 95 48 S145 68, 210 18"
                            stroke={ADMIN_PRIMARY}
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                          <path
                            d="M10 92 H210"
                            stroke="#dbe7f1"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M40 18 V94 M80 18 V94 M120 18 V94 M160 18 V94"
                            stroke="#e6eef6"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                          />
                          <path
                            d="M10 30 H210 M10 55 H210 M10 80 H210"
                            stroke="#e6eef6"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                          />
                          <circle cx="210" cy="18" r="5" fill={ADMIN_PRIMARY} />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-8 py-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <FeatureCard
            icon={<Zap size={34} strokeWidth={2.2} />}
            title="Semplice"
            subtitle="Parti subito"
            text="Una piattaforma pensata per chi vuole iniziare senza perdersi in complessità inutili."
          />

          <FeatureCard
            icon={<ShieldCheck size={34} strokeWidth={2.2} />}
            title="Credibile"
            subtitle="Vendi meglio"
            text="Store pubblici, prodotti ordinati, gestione chiara e una presenza più professionale verso il cliente finale."
          />

          <FeatureCard
            icon={<BarChart3 size={34} strokeWidth={2.2} />}
            title="Scalabile"
            subtitle="Cresci senza rifare tutto"
            text="Una base già pronta per aggiungere pagamenti reali, recensioni, area cliente e protezione nelle transazioni."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#667085]">
            Piani Clients Booster
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#0b1220]">
            Parti semplice, cresci con metodo.
          </h2>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-[#556074]">
            Un percorso pensato per accompagnare il venditore dal primo catalogo
            fino a una presenza online più forte e strutturata.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <PlanCard
            name="Starter"
            title="Inizia subito"
            text="La base giusta per pubblicare i primi prodotti, costruire il negozio e iniziare a validare il mercato."
          />

          <div className="rounded-[32px] border border-[#cfe3ef] bg-[linear-gradient(180deg,#e6f2f8,white)] p-8 shadow-[0_24px_60px_rgba(13,91,130,0.10)]">
            <div className="inline-flex rounded-full border border-[#cfe3ef] bg-white px-3 py-1.5 text-xs font-bold text-[#0d5b82]">
              Più scelto
            </div>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-[#0d5b82]">
              Growth
            </p>
            <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#0b1220]">
              Spingi le vendite
            </h3>
            <p className="mt-4 leading-7 text-[#334155]">
              Più controllo sul catalogo, migliori strumenti organizzativi e una
              gestione più seria di prezzi, stock e operatività.
            </p>
          </div>

          <PlanCard
            name="Pro"
            title="Costruisci un brand"
            text="Più identità, più controllo e una base più forte per evolvere verso un ecosistema ecommerce completo."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#667085]">
              Store attivi
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#0b1220]">
              I negozi che stanno costruendo il loro spazio.
            </h2>
          </div>

          <div className="rounded-full border border-[#e7ebf3] bg-white px-4 py-2 text-sm font-semibold text-[#556074]">
            {storeMap.size} store attivi
          </div>
        </div>

        {stores.length === 0 ? (
          <div className="rounded-[30px] border border-[#e7ebf3] bg-white p-10 text-[#556074] shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
            Nessuno store attivo al momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {stores.map((store) => (
              <Link
                key={store.slug}
                href={`/store/${store.slug}`}
                className="rounded-[30px] border border-[#e7ebf3] bg-white p-7 shadow-[0_16px_40px_rgba(15,23,42,0.05)] transition hover:-translate-y-1"
              >
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#0d5b82]">
                  Store
                </p>
                <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#0b1220]">
                  {store.name}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#556074]">
                  Prodotti pubblicati: {store.products}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#667085]">
            Prodotti in evidenza
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#0b1220]">
            Una selezione dal marketplace.
          </h2>
          <p className="mt-3 max-w-2xl text-lg leading-8 text-[#556074]">
            Alcuni prodotti pubblicati dagli store presenti su Clients Booster.
          </p>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="rounded-[30px] border border-[#e7ebf3] bg-white p-10 text-[#556074] shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
            Nessun prodotto pubblicato.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredProducts.map((product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-[32px] border border-[#e7ebf3] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition hover:-translate-y-1"
              >
                <Link href={`/products/${product.id}`} className="block">
                  <div className="relative h-64 w-full bg-[#eef2f7]">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[#8a94a6]">
                        Nessuna immagine
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-7">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/store/${product.store_slug}`}
                      className="text-sm font-bold text-[#556074] hover:text-[#0b1220]"
                    >
                      {product.store_name}
                    </Link>

                    {product.category ? (
                      <span className="rounded-full border border-[#e7ebf3] bg-[#f8fafc] px-3 py-1 text-xs font-bold text-[#556074]">
                        {product.category}
                      </span>
                    ) : null}
                  </div>

                  <Link href={`/products/${product.id}`}>
                    <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#0b1220]">
                      {product.title}
                    </h3>
                  </Link>

                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#556074]">
                    {product.description || "Nessuna descrizione"}
                  </p>

                  <div className="mt-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {product.sale_price ? (
                        <>
                          <span className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
                            € {product.sale_price}
                          </span>
                          <span className="text-sm text-[#8a94a6] line-through">
                            € {product.price}
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl font-black tracking-[-0.03em] text-[#0b1220]">
                          € {product.price}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/products/${product.id}`}
                      className="rounded-full border border-[#dbe2ee] bg-white px-4 py-2 text-sm font-bold text-[#152033] transition hover:shadow-sm"
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

      <section className="mx-auto max-w-7xl px-6 pb-20 pt-6">
        <div className="overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#071225,#0d4f7c,#0b2e59)] px-8 py-10 text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)] md:px-12 md:py-12">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-100">
            Clients Booster
          </p>
          <h2 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.04em] md:text-5xl">
            Costruisci una presenza più forte.
            <br />
            Vendi con più credibilità.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-sky-100">
            Una piattaforma pensata per portare ordine, immagine e struttura
            dentro il tuo progetto ecommerce.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-sm font-semibold !text-white shadow-[0_10px_30px_rgba(37,183,243,0.25)] transition hover:-translate-y-0.5"
              style={{ backgroundColor: VENDOR_PRIMARY }}
            >
              <Rocket size={18} className="text-white" />
              <span className="text-white">
                Apri il tuo negozio e inizia a vendere
              </span>
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/15"
            >
              Accedi
            </Link>
          </div>
        </div>
      </section>
       <Footer />
    </main>
  );
}

function StatsCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[26px] border border-[#e7ebf3] bg-white p-6 shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
      <div
        className="mb-4 inline-flex rounded-full p-3 text-white shadow-[0_10px_24px_rgba(13,91,130,0.22)]"
        style={{ backgroundColor: ADMIN_PRIMARY }}
      >
        {icon}
      </div>
      <p className="text-sm text-[#667085]">{label}</p>
      <p className="mt-3 text-4xl font-black tracking-[-0.03em] text-[#0b1220]">
        {value}
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  subtitle,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  text: string;
}) {
  return (
    <div className="rounded-[30px] border border-[#e7ebf3] bg-white px-8 py-7 shadow-[0_14px_35px_rgba(15,23,42,0.05)]">
      <div className="grid grid-cols-[112px_1fr] items-start gap-6">
        <div
          className="flex h-[116px] w-[112px] items-center justify-center rounded-[24px] text-white shadow-[0_14px_30px_rgba(13,91,130,0.22)]"
          style={{ backgroundColor: ADMIN_PRIMARY }}
        >
          {icon}
        </div>

        <div>
          <p
            className="text-sm font-bold uppercase tracking-[0.28em]"
            style={{ color: ADMIN_PRIMARY }}
          >
            {title}
          </p>

          <h3 className="mt-3 text-[22px] font-black tracking-[-0.03em] text-[#0b1220]">
            {subtitle}
          </h3>

          <p className="mt-3 max-w-md text-[15px] leading-8 text-[#556074]">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  name,
  title,
  text,
}: {
  name: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[32px] border border-[#e7ebf3] bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#667085]">
        {name}
      </p>
      <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#0b1220]">
        {title}
      </h3>
      <p className="mt-4 leading-7 text-[#556074]">{text}</p>
    </div>
  );
}