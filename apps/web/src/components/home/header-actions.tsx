"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getCustomerToken,
  getToken,
  removeCustomerToken,
  removeToken,
} from "@/lib/auth";
import { LogIn, Store, UserPlus } from "lucide-react";

export default function HeaderActions() {
  const [mounted, setMounted] = useState(false);
  const [vendorLogged, setVendorLogged] = useState(false);
  const [customerLogged, setCustomerLogged] = useState(false);

  useEffect(() => {
    setVendorLogged(!!getToken());
    setCustomerLogged(!!getCustomerToken());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/cart"
          className="rounded-full border border-[#dbe2ee] bg-white px-5 py-2.5 text-sm font-semibold text-[#1b2435] transition hover:-translate-y-0.5 hover:shadow-sm"
        >
          Carrello
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href="/cart"
        className="rounded-full border border-[#dbe2ee] bg-white px-5 py-2.5 text-sm font-semibold text-[#1b2435] transition hover:-translate-y-0.5 hover:shadow-sm"
      >
        Carrello
      </Link>

      {customerLogged ? (
        <>
          <Link
            href="/customer/account"
            className="rounded-full border border-[#dbe2ee] bg-white px-5 py-2.5 text-sm font-semibold text-[#1b2435] transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            Il mio account
          </Link>

          <button
            onClick={() => {
              removeCustomerToken();
              window.location.href = "/";
            }}
            className="rounded-full border border-[#dbe2ee] bg-white px-5 py-2.5 text-sm font-semibold text-[#1b2435] transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            Logout
          </button>
        </>
      ) : vendorLogged ? (
        <>
          <Link
            href="/dashboard"
            className="rounded-full border border-[#dbe2ee] bg-white px-5 py-2.5 text-sm font-semibold text-[#1b2435] transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            Dashboard
          </Link>

          <button
            onClick={() => {
              removeToken();
              window.location.href = "/";
            }}
            className="rounded-full border border-[#dbe2ee] bg-white px-5 py-2.5 text-sm font-semibold text-[#1b2435] transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link
            href="/customer/login"
            className="inline-flex items-center gap-2 rounded-full border border-[#dbe2ee] bg-white px-5 py-2.5 text-sm font-semibold text-[#1b2435] transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <LogIn size={16} />
            Login cliente
          </Link>

          <Link
            href="/customer/register"
            className="inline-flex items-center gap-2 rounded-full border border-[#dbe2ee] bg-white px-5 py-2.5 text-sm font-semibold text-[#1b2435] transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <UserPlus size={16} />
            Registrati cliente
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-[#dbe2ee] bg-white px-5 py-2.5 text-sm font-semibold text-[#1b2435] transition hover:-translate-y-0.5 hover:shadow-sm"
          >
            <Store size={16} />
            Login venditore
          </Link>

          <Link
  href="/register"
  className="inline-flex items-center gap-2 rounded-full bg-[#25b7f3] px-5 py-2.5 text-sm font-semibold !text-white shadow-[0_10px_30px_rgba(37,183,243,0.25)] transition hover:-translate-y-0.5 hover:bg-[#1d9bf0]"
>
  <Store size={16} className="text-white" />
  <span className="text-white">Apri il tuo negozio</span>
</Link>
        </>
      )}
    </div>
  );
}