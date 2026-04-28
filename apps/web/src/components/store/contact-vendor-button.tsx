"use client";

import { getCustomerToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function ContactVendorButton({
  productId,
}: {
  productId: number;
}) {
  const router = useRouter();

  function handleClick() {
    const token = getCustomerToken();

    if (!token) {
      router.push("/customer/login");
      return;
    }

    window.dispatchEvent(
      new CustomEvent("open-vendor-chat", {
        detail: { productId },
      })
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full rounded-full border border-[#2f7d4b] bg-white px-6 py-3 text-sm font-bold text-[#2f7d4b] transition hover:-translate-y-0.5 hover:bg-[#eaf6ee] hover:shadow-sm"
    >
      Contatta il venditore
    </button>
  );
}