"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import { getToken, removeToken } from "@/lib/auth";

type ImportResult = {
  message?: string;
  imported?: number;
  errors?: string[];
};

export default function VendorImportProductsPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleImport() {
    if (!file) {
      setError("Seleziona un file CSV");
      return;
    }

    setUploading(true);
    setError("");
    setResult(null);

    try {
      const token = getToken();

      if (!token) {
        router.push("/login");
        return;
      }

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

      setResult(data);
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

      setError(err.message || "Errore import CSV");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownloadTemplate() {
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
    } catch (err: any) {
      setError(err.message || "Errore download template CSV");
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
            Import prodotti CSV
          </h1>
          <p className="mt-3 text-lg leading-8 text-[#5b667a]">
            Carica un file CSV per inserire più prodotti in modo massivo.
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

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="card-ui p-6">
          <h2 className="text-2xl font-black text-[#0b1220]">
            Caricamento file
          </h2>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
              <label className="text-xs uppercase tracking-[0.2em] text-[#5b667a]">
                File CSV
              </label>

              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-3 w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleImport}
                disabled={uploading || !file}
                className="rounded-full bg-[#25b7f3] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {uploading ? "Import in corso..." : "Importa CSV"}
              </button>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="rounded-full border border-[#dbe2ee] bg-white px-5 py-3 text-sm font-semibold text-[#1b2435]"
              >
                Scarica modello CSV
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-ui p-6">
            <h2 className="text-2xl font-black text-[#0b1220]">
              Suggerimenti
            </h2>

            <div className="mt-6 space-y-3">
              <InfoStrip
                text="Usa il modello CSV ufficiale per compilare correttamente le colonne."
                highlight
              />
              <InfoStrip text="I campi obbligatori minimi sono title e price." />
              <InfoStrip text="Puoi usare l’export CSV del catalogo come base per aggiornamenti massivi." />
              <InfoStrip text="Ogni riga con errore verrà segnalata nel riepilogo finale." />
            </div>
          </div>

          <div className="card-ui p-6">
            <h2 className="text-2xl font-black text-[#0b1220]">Risultato</h2>

            {!result ? (
              <div className="mt-5 rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4 text-[#5b667a]">
                Nessun import eseguito.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-[#cfeffd] bg-[#eef9fe] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#0d5b82]">
                    Prodotti importati
                  </p>
                  <p className="mt-2 text-2xl font-black text-[#0b1220]">
                    {result.imported ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#5b667a]">
                    Messaggio
                  </p>
                  <p className="mt-2 text-base font-semibold text-[#0b1220]">
                    {result.message || "Import completato"}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#e6eaf2] bg-[#fbfcff] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#5b667a]">
                    Errori
                  </p>

                  {result.errors && result.errors.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {result.errors.map((item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-base font-semibold text-[#0b1220]">
                      Nessun errore
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
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