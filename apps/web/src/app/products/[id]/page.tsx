import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "@/components/store/add-to-cart-button";
import { notFound } from "next/navigation";

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
  stock?: number | null;
  sale_price?: string | null;
};

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`http://localhost:9000/api/public/products/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.product || null;
  } catch {
    return null;
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) return notFound();

  return (
    <main className="min-h-screen bg-[#020617] text-white px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-sm text-slate-400 hover:text-white">
          ← Torna al marketplace
        </Link>

        <div className="grid md:grid-cols-2 gap-10 mt-6">
          {/* IMAGE */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="h-[400px] flex items-center justify-center">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.title}
                  width={400}
                  height={400}
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-slate-400">No image</span>
              )}
            </div>
          </div>

          {/* INFO */}
          <div>
            <Link
              href={`/store/${product.store_slug}`}
              className="text-sm text-cyan-300"
            >
              {product.store_name}
            </Link>

            <h1 className="text-3xl font-semibold mt-2">
              {product.title}
            </h1>

            <div className="mt-4">
              {product.sale_price ? (
                <>
                  <span className="text-2xl font-bold">
                    € {product.sale_price}
                  </span>
                  <span className="ml-3 text-slate-400 line-through">
                    € {product.price}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold">
                  € {product.price}
                </span>
              )}
            </div>

            <p className="mt-4 text-slate-300">
              {product.description}
            </p>

            <div className="mt-6">
              <AddToCartButton
                product={{
                  product_id: product.id,
                  title: product.title,
                  price: Number(product.price),
                  sale_price: product.sale_price
                    ? Number(product.sale_price)
                    : null,
                  image_url: product.image_url,
                  store_name: product.store_name,
                  store_slug: product.store_slug,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}