"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { getCustomerToken } from "@/lib/auth";
import { useParams } from "next/navigation";

type Message = {
  id: number;
  sender_type: "customer" | "vendor";
  message: string;
};

export default function ConversationPage() {
  const { id } = useParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  async function load() {
    const res = await fetch(
      `${API_URL}/api/customers/conversations/${id}`,
      {
        headers: {
          Authorization: `Bearer ${getCustomerToken()}`,
        },
      }
    );

    const data = await res.json();
    setMessages(data.messages || []);
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function sendMessage() {
    if (!text.trim()) return;

    await fetch(
      `${API_URL}/api/customers/conversations/${id}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getCustomerToken()}`,
        },
        body: JSON.stringify({ message: text }),
      }
    );

    setText("");
    load();
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black mb-4">Chat</h1>

      <div className="space-y-3 mb-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-3 rounded-xl max-w-[70%] ${
              m.sender_type === "customer"
                ? "bg-blue-500 text-white ml-auto"
                : "bg-gray-200"
            }`}
          >
            {m.message}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Scrivi un messaggio..."
          className="flex-1 border rounded-xl px-4 py-2"
        />

        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 rounded-xl"
        >
          Invia
        </button>
      </div>
    </main>
  );
}