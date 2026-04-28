"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCustomerToken, getToken } from "@/lib/auth";

export default function HeroActions() {
  const [mounted, setMounted] = useState(false);
  const [vendorLogged, setVendorLogged] = useState(false);
  const [customerLogged, setCustomerLogged] = useState(false);

  useEffect(() => {
    setVendorLogged(!!getToken());
    setCustomerLogged(!!getCustomerToken());
    setMounted(true);
  }, []);

  // Evita mismatch SSR
  if (!mounted) {
    return (
      <>
        <Link
          href="/register"
          className="rounded-full bg-[#0d5b82] px-8 py-4 text-sm font-bold shadow-[0_14px_35px_rgba(13,91,130,0.24)] transition hover:-translate-y-0.5 hover:bg-[#0a4a6a]"
          style={{ color: "#ffffff" }}
        >
          Inizia a vendere
        </Link>

        <Link
          href="/customer/login"
          className="rounded-full border border-[#dbe2ee] bg-white px-8 py-4 text-sm font-bold text-[#152033] transition hover:-translate-y-0.5 hover:shadow-sm"
        >
          Accedi come cliente
        </Link>
      </>
    );
  }

  // 👤 CLIENTE LOGGATO
  if (customerLogged) {
    return (
      <>
        <Link
          href="/customer/account"
          className="rounded-full bg-[#0d5b82] px-8 py-4 text-sm font-bold shadow-[0_14px_35px_rgba(13,91,130,0.24)] transition hover:-translate-y-0.5 hover:bg-[#0a4a6a]"
          style={{ color: "#ffffff" }}
        >
          Il mio account
        </Link>

        <Link
          href="/cart"
          className="rounded-full border border-[#dbe2ee] bg-white px-8 py-4 text-sm font-bold text-[#152033] transition hover:-translate-y-0.5 hover:shadow-sm"
        >
          Vai al carrello
        </Link>
      </>
    );
  }

  // 🏪 VENDITORE LOGGATO
  if (vendorLogged) {
    return (
      <>
        <Link
          href="/dashboard"
          className="rounded-full bg-[#0d5b82] px-8 py-4 text-sm font-bold shadow-[0_14px_35px_rgba(13,91,130,0.24)] transition hover:-translate-y-0.5 hover:bg-[#0a4a6a]"
          style={{ color: "#ffffff" }}
        >
          Vai alla dashboard
        </Link>

        <Link
          href="/cart"
          className="rounded-full border border-[#dbe2ee] bg-white px-8 py-4 text-sm font-bold text-[#152033] transition hover:-translate-y-0.5 hover:shadow-sm"
        >
          Vai al carrello
        </Link>
      </>
    );
  }

  // 🚀 UTENTE NON LOGGATO
  return (
    <>
      <Link
        href="/register"
        className="rounded-full bg-[#0d5b82] px-8 py-4 text-sm font-bold shadow-[0_14px_35px_rgba(13,91,130,0.24)] transition hover:-translate-y-0.5 hover:bg-[#0a4a6a]"
        style={{ color: "#ffffff" }}
      >
        Inizia a vendere
      </Link>

      <Link
        href="/customer/login"
        className="rounded-full border border-[#dbe2ee] bg-white px-8 py-4 text-sm font-bold text-[#152033] transition hover:-translate-y-0.5 hover:shadow-sm"
      >
        Accedi come cliente
      </Link>
    </>
  );
}