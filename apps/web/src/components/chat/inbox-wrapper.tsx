"use client";

import { useEffect, useState } from "react";
import InboxWidget from "./inbox-widget";
import { getCustomerToken, getToken } from "@/lib/auth";
import { usePathname } from "next/navigation";

export default function InboxWrapper() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const customerToken = getCustomerToken();
    const vendorToken = getToken();

    setVisible(!!customerToken || !!vendorToken);
  }, [pathname]);

  if (!visible) return null;

  return <InboxWidget />;
}