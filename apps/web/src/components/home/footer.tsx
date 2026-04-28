import Link from "next/link";
import {
  CreditCard,
  ShieldCheck,
  Store,
  Truck,
  Sparkles,
  LockKeyhole,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative left-1/2 mt-24 w-screen -translate-x-1/2 overflow-hidden bg-[#050b16] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,183,243,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(13,91,130,0.28),transparent_38%)]" />

      <div className="relative w-full px-6 py-20 lg:px-16 xl:px-24">
        <div className="grid gap-12 xl:grid-cols-[1.7fr_1fr_1fr_1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#25b7f3]">
              Clients Booster
            </p>

            <h2 className="mt-5 max-w-xl text-4xl font-black leading-tight tracking-[-0.06em] md:text-5xl">
              Il marketplace intelligente per vendere meglio.
            </h2>

            <p className="mt-5 max-w-lg text-sm leading-7 text-white/65">
              Un ecosistema completo per prodotti, ordini, clienti, venditori,
              assistenza, chat e AI integrata nel catalogo.
            </p>

            <div className="mt-8 grid max-w-xl grid-cols-2 gap-3">
              <FooterBadge icon={<ShieldCheck size={16} />} text="Acquisti sicuri" />
              <FooterBadge icon={<CreditCard size={16} />} text="Checkout protetto" />
              <FooterBadge icon={<Store size={16} />} text="Store verificati" />
              <FooterBadge icon={<Truck size={16} />} text="Ordini tracciati" />
              <FooterBadge icon={<Sparkles size={16} />} text="AI catalogo" />
              <FooterBadge icon={<LockKeyhole size={16} />} text="Privacy first" />
            </div>
          </div>

          <FooterColumn
            title="Marketplace"
            links={[
              { label: "Home", href: "/" },
              { label: "Prodotti", href: "/" },
              { label: "Carrello", href: "/cart" },
              { label: "Login cliente", href: "/customer/login" },
            ]}
          />

          <FooterColumn
            title="Venditori"
            links={[
              { label: "Area venditore", href: "/login" },
              { label: "Dashboard", href: "/dashboard" },
              { label: "Prodotti", href: "/dashboard/products" },
              { label: "Ordini", href: "/dashboard/orders" },
            ]}
          />

          <FooterColumn
            title="Legale"
            links={[
              { label: "Termini di servizio", href: "/terms" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Cookie Policy", href: "/cookies" },
              { label: "Supporto", href: "/customer/account/support" },
            ]}
          />
        </div>

        <div className="mt-16 rounded-[34px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black">Pagamenti supportati</p>
              <p className="mt-1 text-xs leading-5 text-white/55">
                Carte, wallet digitali e checkout sicuro per una vendita fluida.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {["Visa", "Mastercard", "Stripe", "Apple Pay", "Google Pay"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white px-4 py-2 text-xs font-black text-[#071225]"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 px-6 py-6 text-xs text-white/50 lg:px-16 xl:px-24">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <p>
            © {new Date().getFullYear()} Clients Booster - Marketplace di nuova generazione. Tutti i
            diritti riservati.
          </p>

          <p>Powered by Euphoria Solutions.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-[0.22em] text-white/80">
        {title}
      </h3>

      <div className="mt-6 space-y-3">
        {links.map((link) => (
          <Link
            key={link.href + link.label}
            href={link.href}
            className="block text-sm font-medium text-white/55 transition hover:translate-x-1 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function FooterBadge({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-bold text-white/80">
      <span className="text-[#25b7f3]">{icon}</span>
      {text}
    </div>
  );
}