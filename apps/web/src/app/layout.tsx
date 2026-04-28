import type { Metadata } from "next";
import "./globals.css";
import BoosterChatWidget from "@/components/chat/booster-chat-widget";
import InboxWrapper from "@/components/chat/inbox-wrapper";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "Clients Booster Marketplace",
    template: "%s | Clients Booster",
  },
  description:
    "Clients Booster è il marketplace intelligente per acquistare prodotti, scoprire store, parlare con i venditori e completare ordini in modo semplice e sicuro.",
  keywords: [
    "marketplace",
    "ecommerce",
    "clients booster",
    "venditori",
    "prodotti online",
    "checkout sicuro",
  ],
  openGraph: {
    title: "Clients Booster Marketplace",
    description:
      "Marketplace intelligente con prodotti, store, chat venditori, checkout sicuro e assistente AI integrato.",
    url: "/",
    siteName: "Clients Booster",
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clients Booster Marketplace",
    description:
      "Scopri prodotti, store e acquista online in modo semplice e sicuro.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body>
        {children}
        <BoosterChatWidget />
        <InboxWrapper />
      </body>
    </html>
  );
}