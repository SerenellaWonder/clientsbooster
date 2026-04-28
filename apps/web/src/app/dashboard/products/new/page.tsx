"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";

export default function VendorNewProductPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${API_URL}/api/vendor/products`, {
        method: "POST",
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Errore creazione prodotto");
      }

      setSuccess("Prodotto creato correttamente");

      router.push(`/dashboard/products/${data.id}`);
    } catch (err: any) {
      console.error(err);
      if (
        err?.message?.toLowerCase().includes("token") ||
        err?.message?.toLowerCase().includes("unauthorized")
      ) {
        removeToken();
        router.push("/login");
        return;
      }

      setError(err.message || "Errore creazione prodotto");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#25b7f3]">
            Clients Booster
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#0b1220]">
            Nuovo prodotto
          </h1>
          <p className="mt-3 text-lg leading-8 text-[#5b667a]">
            Crea un nuovo prodotto per il tuo catalogo con tutti i dati
            principali.
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

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <InputField label="Titolo" value={title} onChange={setTitle} required />
            <TextareaField
              label="Descrizione"
              value={description}
              onChange={setDescription}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="Prezzo"
                value={price}
                onChange={setPrice}
                required
              />
              <InputField
                label="Categoria"
                value={category}
                onChange={setCategory}
              />
              <InputField label="Tag" value={tags} onChange={setTags} />
              <InputField label="SKU" value={sku} onChange={setSku} />
              <InputField label="Stock" value={stock} onChange={setStock} />
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
                {saving ? "Creazione..." : "Crea prodotto"}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card-ui p-6">
            <h2 className="text-2xl font-black text-[#0b1220]">Anteprima</h2>

            <div className="mt-5 rounded-[24px] border border-[#e6eaf2] bg-[#fbfcff] p-5">
              <p className="text-sm font-semibold text-[#8a94a6]">
                Prodotto nuovo
              </p>
              <h3 className="mt-2 text-2xl font-black text-[#0b1220]">
                {title || "Titolo prodotto"}
              </h3>
              <p className="mt-2 text-sm text-[#5b667a]">
                {category || "Categoria"}
              </p>
              <p className="mt-4 text-sm leading-6 text-[#334155]">
                {description || "La descrizione del prodotto apparirà qui."}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="text-xl font-black text-[#0b1220]">
                  {price ? `€ ${Number(price || 0).toFixed(2)}` : "€ 0.00"}
                </span>

                {salePrice ? (
                  <span className="rounded-full border border-[#cfeffd] bg-[#eef9fe] px-3 py-1 text-xs font-bold text-[#0d5b82]">
                    In sconto
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="card-ui p-6">
            <h2 className="text-2xl font-black text-[#0b1220]">Suggerimenti</h2>

            <div className="mt-6 space-y-3">
              <InfoStrip
                text="Usa un titolo chiaro e descrittivo per migliorare la visibilità."
                highlight
              />
              <InfoStrip text="Aggiungi categoria, SKU e stock per una gestione più precisa." />
              <InfoStrip text="Se hai uno sconto, compila prezzo barrato e prezzo scontato." />
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
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
      <label className="text-xs uppercase tracking-[0.2em] text-[#5b667a]">
        {label}
      </label>
      <input
        required={required}
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

function InfoStrip({
  text,
  highlight,
}: {
  text: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-2xl border border-[#cfeffd] bg-[#eef9fe] px-4 py-4 text-sm font-semibold text-[#0d5b82]"
          : "rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] px-4 py-4 text-sm text-[#334155]"
      }
    >
      {text}
    </div>
  );
}