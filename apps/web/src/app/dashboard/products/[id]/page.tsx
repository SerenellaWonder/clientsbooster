"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";

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

export default function VendorProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [status, setStatus] = useState("draft");

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProduct() {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/vendor/products/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Errore caricamento prodotto");
        }

        const p = data.product;
        setProduct(p);
        setTitle(p.title || "");
        setDescription(p.description || "");
        setPrice(String(p.price || ""));
        setCategory(p.category || "");
        setTags(p.tags || "");
        setSku(p.sku || "");
        setStock(String(p.stock ?? ""));
        setCompareAtPrice(p.compare_at_price ? String(p.compare_at_price) : "");
        setSalePrice(p.sale_price ? String(p.sale_price) : "");
        setStatus(p.status || "draft");
      } catch (err: any) {
        setError(err.message || "Errore caricamento prodotto");
      } finally {
        setLoading(false);
      }
    }

    if (params?.id) {
      loadProduct();
    }
  }, [params, router]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      const res = await fetch(`${API_URL}/api/vendor/products/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          price,
          category,
          tags,
          sku,
          stock,
          compare_at_price: compareAtPrice,
          sale_price: salePrice,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore aggiornamento prodotto");
      }

      setProduct(data.product);
      setSuccess("Prodotto aggiornato correttamente");
    } catch (err: any) {
      setError(err.message || "Errore aggiornamento prodotto");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload() {
    if (!imageFile) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();
      const formData = new FormData();
      formData.append("image", imageFile);

      const res = await fetch(`${API_URL}/api/vendor/products/${params.id}/image`, {
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

      setProduct(data.product);
      setImageFile(null);
      setSuccess("Immagine caricata correttamente");
    } catch (err: any) {
      setError(err.message || "Errore upload immagine");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Vuoi eliminare questo prodotto? Questa azione non si può annullare."
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      const res = await fetch(`${API_URL}/api/vendor/products/${params.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore eliminazione prodotto");
      }

      router.push("/dashboard/products");
    } catch (err: any) {
      setError(err.message || "Errore eliminazione prodotto");
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className="text-[#5b667a]">Caricamento prodotto...</div>;
  }

  if (!product) {
    return <div className="text-[#5b667a]">Prodotto non trovato.</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#25b7f3]">
            Clients Booster
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#0b1220]">
            Prodotto #{product.id}
          </h1>
          <p className="mt-3 text-lg leading-8 text-[#5b667a]">
            Modifica completa del prodotto e della sua pubblicazione.
          </p>
        </div>

        <Link
          href="/dashboard/products"
          className="rounded-full border border-[#dbe2ee] bg-white px-5 py-2.5 text-sm font-semibold text-[#1b2435]"
        >
          ← Prodotti
        </Link>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="card-ui p-6">
          <h2 className="text-2xl font-black text-[#0b1220]">Dati prodotto</h2>

          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <InputField label="Titolo" value={title} onChange={setTitle} />
            <TextareaField
              label="Descrizione"
              value={description}
              onChange={setDescription}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Prezzo" value={price} onChange={setPrice} />
              <InputField label="Categoria" value={category} onChange={setCategory} />
              <InputField label="Tag" value={tags} onChange={setTags} />
              <InputField label="SKU" value={sku} onChange={setSku} />
              <InputField label="Stock" value={stock} onChange={setStock} />
              <SelectField label="Stato" value={status} onChange={setStatus} />
              <InputField
                label="Prezzo barrato"
                value={compareAtPrice}
                onChange={setCompareAtPrice}
              />
              <InputField
                label="Prezzo scontato"
                value={salePrice}
                onChange={setSalePrice}
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#25b7f3] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Salvataggio..." : "Salva modifiche"}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 disabled:opacity-50"
              >
                {deleting ? "Eliminazione..." : "Elimina prodotto"}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card-ui p-6">
            <h2 className="text-2xl font-black text-[#0b1220]">Immagine</h2>

            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.title}
                className="mt-5 h-56 w-full rounded-[24px] object-cover"
              />
            ) : (
              <div className="mt-5 rounded-[24px] border border-dashed border-[#dbe2ee] bg-[#fbfcff] p-6 text-[#5b667a]">
                Nessuna immagine caricata.
              </div>
            )}

            <div className="mt-5 space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 text-sm"
              />

              <button
                type="button"
                onClick={handleImageUpload}
                disabled={uploading || !imageFile}
                className="rounded-full bg-[#25b7f3] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {uploading ? "Upload..." : "Carica immagine"}
              </button>
            </div>
          </div>

          <div className="card-ui p-6">
            <h2 className="text-2xl font-black text-[#0b1220]">Riepilogo</h2>

            <div className="mt-5 space-y-4">
              <InfoBox label="ID prodotto" value={`#${product.id}`} />
              <InfoBox label="Stato attuale" value={status} />
              <InfoBox label="Prezzo attuale" value={`€ ${price || "0.00"}`} />
              <InfoBox label="Stock attuale" value={stock || "0"} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
      <label className="text-xs uppercase tracking-[0.2em] text-[#5b667a]">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
      <label className="text-xs uppercase tracking-[0.2em] text-[#5b667a]">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 min-h-[120px] w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
      <label className="text-xs uppercase tracking-[0.2em] text-[#5b667a]">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none"
      >
        <option value="draft">draft</option>
        <option value="published">published</option>
      </select>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[#5b667a]">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-[#0b1220]">
        {value}
      </p>
    </div>
  );
}