"use client";

import { useEffect, useState } from "react";
import InboxWidget from "./inbox-widget";
import { getToken } from "@/lib/auth";
import { getCustomerToken } from "@/lib/auth";

export default function InboxWrapper() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const vendorToken = getToken();
    const customerToken = getCustomerToken();

    if (vendorToken || customerToken) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return <InboxWidget />;
}