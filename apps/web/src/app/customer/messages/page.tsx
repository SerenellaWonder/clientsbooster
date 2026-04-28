"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCustomerToken } from "@/lib/auth";
import { useRouter } from "next/navigation";

type Conversation = {
  id: number;
  product_title: string;
  store_name: string;
  last_message: string;
  updated_at: string;
};

export default function CustomerMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const res = await fetch(`${API_URL}/api/customers/conversations`, {
        headers: {
          Authorization: `Bearer ${getCustomerToken()}`,
        },
      });

      const data = await res.json();
      setConversations(data.conversations || []);
    }

    load();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-black mb-6">Messaggi</h1>

      <div className="space-y-4">
        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => router.push(`/customer/messages/${c.id}`)}
            className="cursor-pointer rounded-2xl border p-4 hover:shadow"
          >
            <p className="font-bold">{c.product_title}</p>
            <p className="text-sm text-gray-500">{c.store_name}</p>
            <p className="mt-2 text-sm">{c.last_message}</p>
          </div>
        ))}
      </div>
    </main>
  );
}