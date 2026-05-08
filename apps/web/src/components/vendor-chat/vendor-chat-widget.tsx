"use client";

import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
//import VendorChatPanel from "./vendor-chat-panel";

export default function VendorChatWidget({
  productId,
}: {
  productId: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-full border border-[#2f7d4b] bg-white px-6 py-3 text-sm font-bold text-[#2f7d4b] transition hover:-translate-y-0.5 hover:bg-[#eaf6ee] hover:shadow-sm"
      >
        Contatta il venditore
      </button>

      {open ? (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] overflow-hidden rounded-[28px] border border-[#e6eaf2] bg-white shadow-[0_25px_80px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between bg-[#2f7d4b] px-5 py-4 text-white">
            <div>
              <p className="text-sm font-black">Chat venditore → Messaggi venditore</p>
              <p className="text-xs text-[#667085] text-center">
  Il venditore potrebbe rispondere con qualche ora di attesa
</p>
              <p className="text-xs text-white/80">Lascia un messaggio</p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full bg-white/15 p-2 transition hover:bg-white/25"
            >
              <X size={18} />
            </button>
          </div>

         
        </div>
      ) : null}
    </div>
  );
}