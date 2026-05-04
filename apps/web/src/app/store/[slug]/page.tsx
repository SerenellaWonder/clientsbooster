import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { API_URL } from "@/lib/api";

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
  image_url?: string | null;
  category?: string | null;
  sale_price?: string | null;
};

async function getStore(slug: string) {
  const res = await fetch(`${API_URL}/api/public/stores/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.store;
}

async function getProducts(slug: string) {
  const res = await fetch(
    `${API_URL}/api/public/stores/${slug}/products`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.products;
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [store, products] = await Promise.all([
    getStore(slug),
    getProducts(slug),
  ]);

  if (!store) notFound();

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-6 py-10 text-[#0b1220]">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm text-[#5b667a] hover:text-[#0b1220]">
          ← Marketplace
        </Link>

        <div className="mt-8 card-ui p-8">
          <h1 className="text-4xl font-black">{store.name}</h1>
          <p className="mt-3 text-[#5b667a]">
            Catalogo prodotti del negozio
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product: Product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="card-ui overflow-hidden p-0 transition hover:-translate-y-1"
            >
              <div className="relative h-60 bg-[#eef2f7]">
                {product.image_url && (
                  <Image
                    src={product.image_url}
                    alt={product.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>

              <div className="p-6">
                <h3 className="text-2xl font-black">{product.title}</h3>

                <p className="mt-2 text-sm text-[#5b667a] line-clamp-2">
                  {product.description}
                </p>

                <div className="mt-4">
                  {product.sale_price ? (
                    <>
                      <span className="text-xl font-black">
                        € {product.sale_price}
                      </span>
                      <span className="ml-2 text-sm line-through text-[#8a94a6]">
                        € {product.price}
                      </span>
                    </>
                  ) : (
                    <span className="text-xl font-black">
                      € {product.price}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}