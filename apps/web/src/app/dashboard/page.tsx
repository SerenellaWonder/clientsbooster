"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/header";
import { apiFetch } from "@/lib/api";
import { removeToken } from "@/lib/auth";

type VendorMe = {
  email: string;
  role: string;
  store_name: string;
  store_slug: string;
};

type DashboardData = {
  stats: {
    products: number;
    publishedProducts: number;
    orders: number;
  };
};

export default function DashboardPage() {
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorMe | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [vendorData, dashboardData] = await Promise.all([
          apiFetch("/api/vendor/me"),
          apiFetch("/api/vendor/dashboard"),
        ]);

        setVendor(vendorData);
        setDashboard(dashboardData);
      } catch {
        removeToken();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  if (loading) {
    return <div className="text-slate-400">Caricamento dashboard...</div>;
  }

  return (
    <div>
      <DashboardHeader
        title={`Ciao ${vendor?.store_name ?? ""}`}
        subtitle="Panoramica del tuo negozio"
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(2,6,23,0.22)] backdrop-blur">
          <p className="text-sm text-slate-400">Prodotti totali</p>
          <h3 className="mt-4 text-4xl font-semibold text-white">
            {dashboard?.stats.products ?? 0}
          </h3>
          <p className="mt-3 text-sm text-slate-500">
            Elementi presenti nel catalogo.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(2,6,23,0.22)] backdrop-blur">
          <p className="text-sm text-slate-400">Prodotti pubblicati</p>
          <h3 className="mt-4 text-4xl font-semibold text-white">
            {dashboard?.stats.publishedProducts ?? 0}
          </h3>
          <p className="mt-3 text-sm text-slate-500">
            Prodotti attivi e visibili online.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(2,6,23,0.22)] backdrop-blur">
          <p className="text-sm text-slate-400">Ordini</p>
          <h3 className="mt-4 text-4xl font-semibold text-white">
            {dashboard?.stats.orders ?? 0}
          </h3>
          <p className="mt-3 text-sm text-slate-500">
            Ordini registrati dal checkout.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(2,6,23,0.22)] backdrop-blur">
          <h2 className="text-xl font-semibold text-white">
            Informazioni negozio
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Email
              </p>
              <p className="mt-2 text-base font-medium text-slate-200">
                {vendor?.email}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Ruolo
              </p>
              <p className="mt-2 text-base font-medium text-slate-200">
                {vendor?.role}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Slug negozio
              </p>
              <p className="mt-2 text-base font-medium text-slate-200">
                {vendor?.store_slug}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_18px_40px_rgba(2,6,23,0.22)] backdrop-blur">
          <h2 className="text-xl font-semibold text-white">
            Focus operativo
          </h2>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/10 px-4 py-4 text-sm text-cyan-100">
              Controlla lo stato degli ordini appena ricevuti.
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-slate-300">
              Pubblica nuovi prodotti per aumentare la visibilità del catalogo.
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-slate-300">
              Prepara il negozio al pagamento reale e alla crescita del volume ordini.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}