"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { API_URL } from "@/lib/api";
import { setCustomerToken } from "@/lib/auth";

declare global {
  interface Window {
    google?: any;
  }
}

export default function CustomerLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const script = document.createElement("script");

    script.src = "https://accounts.google.com/gsi/client";

    script.async = true;

    script.defer = true;

    script.onload = () => {
      if (!window.google) return;

     const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  setError("Google login non configurato");
  return;
}

window.google.accounts.id.initialize({
  client_id: googleClientId,
  callback: handleGoogleLogin,
});

      window.google.accounts.id.renderButton(
        document.getElementById(
          "google-login-button"
        ),
        {
          theme: "outline",
          size: "large",
          shape: "pill",
          width: "100%",
        }
      );
    };

    document.body.appendChild(script);
  }, []);

  async function handleGoogleLogin(
    response: any
  ) {
    try {
      const res = await fetch(
        `${API_URL}/api/customers/google-login`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            credential:
              response.credential,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Errore login Google"
        );
      }

      setCustomerToken(data.token);

      router.push(
        "/customer/account"
      );
    } catch (err: any) {
      setError(
        err.message ||
          "Errore login Google"
      );
    }
  }

  async function handleSubmit(
    e: FormEvent
  ) {
    e.preventDefault();

    setLoading(true);

    setError("");

    try {
      const res = await fetch(
        `${API_URL}/api/customers/login`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Errore login cliente"
        );
      }

      setCustomerToken(data.token);

      router.push(
        "/customer/account"
      );
    } catch (err: any) {
      setError(
        err.message ||
          "Errore login cliente"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center">
        <div className="w-full rounded-[28px] border border-[#e6eaf2] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <span className="inline-flex rounded-full border border-[#cfe7d6] bg-[#eaf6ee] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#2f7d4b]">
              Clients Booster
            </span>

            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-[#0b1220]">
              Login cliente
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#5b667a]">
              Accedi al tuo account
              oppure continua con
              Google.
            </p>
          </div>

          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div
            id="google-login-button"
            className="mb-5 flex justify-center"
          />

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e6eaf2]" />
            </div>

            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-xs font-bold uppercase tracking-[0.2em] text-[#94a3b8]">
                oppure
              </span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder="nome@email.com"
                required
                className="mt-2 w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#2f7d4b]"
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="Inserisci la password"
                required
                className="mt-2 w-full rounded-2xl border border-[#dbe2ee] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#2f7d4b]"
              />
            </Field>

            <div className="flex justify-end">
              <Link
                href="/customer/forgot-password"
                className="text-sm font-semibold text-[#2f7d4b]"
              >
                Password dimenticata?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-[#2f7d4b] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-50"
            >
              {loading
                ? "Accesso..."
                : "Accedi"}
            </button>
          </form>

          <div className="mt-5 border-t border-[#eef2f7] pt-5 text-sm text-[#5b667a]">
            Non hai ancora un
            account?{" "}
            <Link
              href="/customer/register"
              className="font-semibold text-[#2f7d4b]"
            >
              Registrati
            </Link>
          </div>

          <div className="mt-3 text-sm text-[#5b667a]">
            <Link
              href="/"
              className="font-semibold text-[#2f7d4b]"
            >
              Torna al marketplace
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-[0.18em] text-[#5b667a]">
        {label}
      </label>

      {children}
    </div>
  );
}