"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

type Product = {
  id: number;
  title: string;
  description: string;
  price: string;
  status: string;
  category?: string | null;
  tags?: string | null;
  sku?: string | null;
  stock?: number | null;
  compare_at_price?: string | null;
  sale_price?: string | null;
  image_url?: string | null;
  created_at: string;
};

function formatCurrency(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  return `€ ${Number(value).toFixed(2)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("it-IT");
}

export default function VendorProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function loadProducts() {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/vendor/products`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Errore caricamento prodotti");
        }

        setProducts(data.products || []);
      } catch (error) {
        console.error(error);
        removeToken();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [router]);

  async function handleExportCsv() {
    try {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${API_URL}/api/vendor/products/export/csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        let message = "Errore export CSV";
        try {
          const data = await res.json();
          message = data.error || message;
        } catch {}
        throw new Error(message);
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
    } catch (error: any) {
      alert(error.message || "Errore export CSV");
    }
  }

  async function handleDownloadTemplateCsv() {
    try {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${API_URL}/api/vendor/products/template/csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        let message = "Errore download template CSV";
        try {
          const data = await res.json();
          message = data.error || message;
        } catch {}
        throw new Error(message);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "catalog-template.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error.message || "Errore download template CSV");
    }
  }

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !q ||
        String(product.id).includes(q) ||
        product.title?.toLowerCase().includes(q) ||
        product.category?.toLowerCase().includes(q) ||
        product.sku?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || product.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  if (loading) {
    return <div className="text-[#5b667a]">Caricamento prodotti...</div>;
  }

  return (
    <div>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#25b7f3]">
          Clients Booster
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#0b1220]">
          Prodotti
        </h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-[#5b667a]">
          Cerca, filtra e gestisci il catalogo del tuo negozio.
        </p>
      </div>

      <div className="mt-8 grid gap-4 rounded-[28px] border border-[#e6eaf2] bg-white p-5 md:grid-cols-[1fr_220px_auto_auto_auto_auto]">
        <input
          type="text"
          placeholder="Cerca per nome, categoria, SKU o ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none"
        >
          <option value="all">Tutti gli stati</option>
          <option value="draft">draft</option>
          <option value="published">published</option>
        </select>

        <button
          type="button"
          onClick={handleExportCsv}
          className="rounded-full border border-[#dbe2ee] bg-white px-5 py-3 text-center text-sm font-semibold text-[#1b2435]"
        >
          Esporta CSV
        </button>

        <button
          type="button"
          onClick={handleDownloadTemplateCsv}
          className="rounded-full border border-[#dbe2ee] bg-white px-5 py-3 text-center text-sm font-semibold text-[#1b2435]"
        >
          Modello CSV
        </button>

        <Link
          href="/dashboard/products/import"
          className="rounded-full border border-[#dbe2ee] bg-white px-5 py-3 text-center text-sm font-semibold text-[#1b2435]"
        >
          Importa CSV
        </Link>

        <Link
          href="/dashboard/products/new"
          className="rounded-full bg-[#25b7f3] px-5 py-3 text-center text-sm font-semibold text-white"
        >
          Nuovo prodotto
        </Link>
      </div>

      <div className="mt-6 rounded-[28px] border border-[#e6eaf2] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-[#0b1220]">Lista prodotti</h2>
          <span className="rounded-full border border-[#dbe2ee] bg-[#fbfcff] px-3 py-1 text-sm font-semibold text-[#425066]">
            {filteredProducts.length} risultati
          </span>
        </div>

        <div className="space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4 text-[#5b667a]">
              Nessun prodotto trovato.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-[24px] border border-[#e6eaf2] bg-[#fbfcff] p-4"
              >
                <div className="mb-3 flex justify-end">
                  <Link
                    href={`/dashboard/products/${product.id}`}
                    className="rounded-full border border-[#dbe2ee] bg-white px-3 py-1 text-xs font-semibold text-[#1b2435]"
                  >
                    Apri dettaglio
                  </Link>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.7fr]">
                  <div>
                    <p className="text-sm font-semibold text-[#8a94a6]">
                      Prodotto #{product.id}
                    </p>
                    <h3 className="mt-1 text-xl font-black tracking-[-0.03em] text-[#0b1220]">
                      {product.title}
                    </h3>
                    <p className="mt-1 text-sm text-[#5b667a]">
                      {product.category || "Senza categoria"}
                    </p>
                  </div>

                  <div className="flex flex-col justify-center gap-2">
                    <p className="text-sm text-[#5b667a]">Prezzo</p>
                    <p className="text-lg font-black text-[#0b1220]">
                      {formatCurrency(product.sale_price || product.price)}
                    </p>
                    <p className="text-sm text-[#5b667a]">
                      Stock: {product.stock ?? 0}
                    </p>
                  </div>

                  <div className="flex flex-col justify-center gap-2">
                    <span className="w-fit rounded-full border border-[#dbe2ee] bg-white px-3 py-1 text-xs font-bold text-[#425066]">
                      {product.status}
                    </span>
                    <p className="text-sm text-[#5b667a]">
                      SKU: {product.sku || "—"}
                    </p>
                    <p className="text-xs text-[#8a94a6]">
                      Creato il {formatDate(product.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}