"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/header";
import { apiFetch, API_URL } from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";

type Product = {
  id: number;
  title: string;
  description: string;
  price: string;
  status: "draft" | "published";
  image_url?: string | null;
  category?: string | null;
  tags?: string | null;
  sku?: string | null;
  stock?: number | null;
  compare_at_price?: string | null;
  sale_price?: string | null;
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("0");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadProducts() {
    try {
      const data = await apiFetch("/api/vendor/products");
      setProducts(data.products || []);
    } catch {
      removeToken();
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setCreating(true);

    try {
      await apiFetch("/api/vendor/products", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          category,
          tags,
          sku,
          stock: Number(stock),
          compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
          sale_price: salePrice ? Number(salePrice) : null,
        }),
      });

      setTitle("");
      setDescription("");
      setPrice("");
      setCategory("");
      setTags("");
      setSku("");
      setStock("0");
      setCompareAtPrice("");
      setSalePrice("");
      setSuccess("Prodotto creato correttamente");
      await loadProducts();
    } catch (err: any) {
      setError(err.message || "Errore creazione prodotto");
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(productId: number, status: "draft" | "published") {
    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/vendor/products/${productId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setSuccess(
        status === "published"
          ? "Prodotto pubblicato correttamente"
          : "Prodotto riportato in bozza"
      );

      await loadProducts();
    } catch (err: any) {
      setError(err.message || "Errore aggiornamento stato");
    }
  }

  async function deleteProduct(productId: number) {
    const confirmed = window.confirm(
      "Sei sicura di voler eliminare questo prodotto?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/api/vendor/products/${productId}`, {
        method: "DELETE",
      });

      setSuccess("Prodotto eliminato correttamente");
      await loadProducts();
    } catch (err: any) {
      setError(err.message || "Errore eliminazione prodotto");
    }
  }

  async function handleImageUpload(productId: number, file: File) {
    const token = getToken();

    if (!token) {
      removeToken();
      router.push("/login");
      return;
    }

    setUploadingId(productId);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_URL}/api/vendor/products/${productId}/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore upload immagine");
      }

      setSuccess("Immagine caricata correttamente");
      await loadProducts();
    } catch (err: any) {
      setError(err.message || "Errore upload immagine");
    } finally {
      setUploadingId(null);
    }
  }

  async function handleCsvImport(file: File) {
    const token = getToken();

    if (!token) {
      removeToken();
      router.push("/login");
      return;
    }

    setImporting(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/vendor/products/import/csv`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore import CSV");
      }

      const imported = data.imported || 0;
      const errors = data.errors || [];

      if (errors.length > 0) {
        setSuccess(`Import completato: ${imported} prodotti importati`);
        setError(errors.join(" | "));
      } else {
        setSuccess(`Import completato: ${imported} prodotti importati`);
      }

      await loadProducts();
    } catch (err: any) {
      setError(err.message || "Errore import CSV");
    } finally {
      setImporting(false);
    }
  }

  async function handleCsvExport() {
    const token = getToken();

    if (!token) {
      removeToken();
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/vendor/products/export/csv`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Errore export CSV");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "catalog-export.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccess("Export CSV completato");
    } catch (err: any) {
      setError(err.message || "Errore export CSV");
    }
  }

  function downloadCsvTemplate() {
    const template =
      "title,description,price,category,tags,sku,stock,compare_at_price,sale_price,status,image_url\n" +
      'Lampada in legno,Lampada artigianale moderna,49.99,Arredamento,"design, legno, handmade",SKU-001,12,69.99,39.99,published,\n';

    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "catalog-template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div>
      <DashboardHeader
        title="Prodotti"
        subtitle="Gestisci catalogo, pricing, immagini e CSV"
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={handleCsvExport}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Esporta CSV
        </button>

        <button
          onClick={downloadCsvTemplate}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Scarica template CSV
        </button>

        <label className="cursor-pointer rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90">
          {importing ? "Import in corso..." : "Importa CSV"}
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCsvImport(file);
            }}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[460px_1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(2,6,23,0.22)] backdrop-blur">
          <h2 className="text-xl font-semibold text-white">Nuovo prodotto</h2>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-400">Titolo</label>
              <input
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Es. Lampada artigianale"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Descrizione
              </label>
              <textarea
                className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrivi il prodotto"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm text-slate-400">Prezzo</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="29.99"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Prezzo scontato
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="19.99"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Prezzo di confronto
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="39.99"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Categoria
                </label>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Arredamento"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-400">SKU</label>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SKU-001"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Tag (separati da virgola)
              </label>
              <input
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="artigianale, design, legno"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">Stock</label>
              <input
                type="number"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950 transition hover:opacity-90"
            >
              {creating ? "Creazione..." : "Crea prodotto"}
            </button>
          </form>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(2,6,23,0.22)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Catalogo attuale
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Gestisci stato, immagine, categoria, stock e pricing.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200">
              {products.length} prodotti
            </div>
          </div>

          {loading ? (
            <p className="mt-5 text-slate-400">Caricamento prodotti...</p>
          ) : products.length === 0 ? (
            <p className="mt-5 text-slate-400">Nessun prodotto presente.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-4">
                      <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-white/5">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-slate-500">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">
                            {product.title}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              product.status === "published"
                                ? "bg-emerald-400/15 text-emerald-200 border border-emerald-400/20"
                                : "bg-amber-400/15 text-amber-200 border border-amber-400/20"
                            }`}
                          >
                            {product.status === "published" ? "Pubblicato" : "Bozza"}
                          </span>

                          {product.sale_price ? (
                            <span className="rounded-full bg-rose-400/15 px-3 py-1 text-xs font-medium text-rose-200 border border-rose-400/20">
                              In offerta
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 text-sm text-slate-400">
                          {product.description || "Nessuna descrizione"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-400">
                          <span>Categoria: {product.category || "-"}</span>
                          <span>SKU: {product.sku || "-"}</span>
                          <span>Stock: {product.stock ?? 0}</span>
                        </div>

                        {product.tags ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {product.tags.split(",").map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300"
                              >
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-3 flex items-center gap-3">
                          {product.sale_price ? (
                            <>
                              <span className="text-lg font-semibold text-white">
                                € {product.sale_price}
                              </span>
                              <span className="text-sm text-slate-500 line-through">
                                € {product.price}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-semibold text-white">
                              € {product.price}
                            </span>
                          )}

                          {product.compare_at_price ? (
                            <span className="text-sm text-slate-500">
                              confronto: € {product.compare_at_price}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {product.status === "draft" ? (
                      <button
                        onClick={() => updateStatus(product.id, "published")}
                        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90"
                      >
                        Pubblica
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(product.id, "draft")}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                      >
                        Rimetti in bozza
                      </button>
                    )}

                    <label className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                      {uploadingId === product.id ? "Caricamento..." : "Carica immagine"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(product.id, file);
                          }
                        }}
                      />
                    </label>

                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-400/15"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}