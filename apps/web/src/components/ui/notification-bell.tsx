"use client";

import Link from "next/link";

export default function NotificationBell({
  count,
  href,
}: {
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#dbe2ee] bg-white text-[#1b2435] transition hover:-translate-y-0.5 hover:shadow-sm"
      aria-label="Notifiche"
      title="Notifiche"
    >
      <span className="text-lg">🔔</span>

      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#0d5b82] px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}