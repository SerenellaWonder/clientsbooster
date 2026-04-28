"use client";

import { useState } from "react";
import { addToCart, type CartItem } from "@/lib/cart";
import { useRouter } from "next/navigation";
import { Check, ShoppingCart } from "lucide-react";

export default function AddToCartButton({
  product,
  disabled = false,
}: {
  product: Omit<CartItem, "quantity">;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (disabled) return;

    addToCart({
      ...product,
      quantity: 1,
    });

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1600);
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled}
        className={`group relative w-full overflow-hidden rounded-full px-6 py-4 text-base font-black text-white shadow-[0_16px_36px_rgba(13,91,130,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(13,91,130,0.28)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${
          added
            ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
            : "bg-gradient-to-r from-[#0d5b82] to-[#1e88c9]"
        }`}
      >
        <span className="absolute inset-0 -translate-x-full bg-white/20 transition group-hover:translate-x-0" />

        <span className="relative z-10 flex items-center justify-center gap-2">
          {disabled ? (
            "Non disponibile"
          ) : added ? (
            <>
              <Check size={20} />
              Aggiunto al carrello
            </>
          ) : (
            <>
              <ShoppingCart size={20} />
              Aggiungi al carrello
            </>
          )}
        </span>
      </button>

      <button
        type="button"
        onClick={() => router.push("/cart")}
        className="mt-3 w-full rounded-full border border-[#dbe2ee] bg-white px-6 py-3 text-sm font-bold text-[#0b1220] transition hover:-translate-y-0.5 hover:shadow-sm"
      >
        Vai al carrello
      </button>
    </div>
  );
}