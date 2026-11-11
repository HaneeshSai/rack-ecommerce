import Link from "next/link";
import { CartProvider } from "@/components/cart";
import { CartLink } from "./cart-link";
import { BRAND } from "@/lib/brand";
import { getCategories } from "@/lib/data/catalog";
import { ViewerBanner, ViewerMenu, ViewerProvider } from "@/components/store/viewer";
import { CompareBar, CompareProvider } from "@/components/store/compare";
import { SearchBox } from "@/components/store/search-box";

const INFO_LINKS = [
  ["about", "About us"],
  ["contact", "Contact"],
  ["warehouses", "Warehouse locations"],
  ["shipping-returns", "Shipping & returns"],
  ["terms", "Terms"],
  ["privacy", "Privacy"],
];

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  const wa = `https://wa.me/${BRAND.supportPhone.replace(/\D/g, "")}?text=${encodeURIComponent("Hi, I need help choosing a rack.")}`;
  return (
    <ViewerProvider>
      <CompareProvider>
        <CartProvider>
          <div className="bg-brand-2 text-xs text-slate-200">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5">
              <span>Free delivery on orders above &#8377;25,000</span>
              <span className="hidden sm:inline">
                Call {BRAND.supportPhone} &middot; <Link href="/dealer-registration" className="underline hover:text-white">Become a dealer</Link>
              </span>
            </div>
          </div>
          <header className="sticky top-0 z-10 border-b border-line bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
              <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm text-white">R</span>
                <span>
                  <span className="text-accent">Rack</span>
                  {BRAND.name.replace("Rack", "")}
                </span>
              </Link>
              <SearchBox className="hidden max-w-xs flex-1 md:block" />
              <div className="flex items-center gap-2">
                <ViewerMenu />
                <CartLink />
              </div>
            </div>
            <div className="mx-auto max-w-6xl px-4 pb-2 md:hidden">
              <SearchBox />
            </div>
            <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 text-sm font-medium">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className="whitespace-nowrap rounded-lg px-3 py-1.5 text-muted transition hover:bg-slate-100 hover:text-foreground"
                >
                  {c.name}
                </Link>
              ))}
            </nav>
          </header>
          <ViewerBanner />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <footer className="mt-12 bg-brand text-slate-300">
            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4">
              <div>
                <div className="text-lg font-extrabold text-white">
                  <span className="text-accent">Rack</span>
                  {BRAND.name.replace("Rack", "")}
                </div>
                <p className="mt-2 max-w-xs text-sm">{BRAND.tagline}.</p>
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold text-white">Shop</div>
                <ul className="space-y-1 text-sm">
                  {categories.slice(0, 4).map((c) => (
                    <li key={c.id}><Link href={`/category/${c.slug}`} className="hover:text-white">{c.name}</Link></li>
                  ))}
                  <li><Link href="/request-quote" className="hover:text-white">Request a quote</Link></li>
                  <li><Link href="/dealer-registration" className="hover:text-white">Dealer registration</Link></li>
                </ul>
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold text-white">Company</div>
                <ul className="space-y-1 text-sm">
                  {INFO_LINKS.map(([slug, label]) => (
                    <li key={slug}><Link href={`/${slug}`} className="hover:text-white">{label}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold text-white">Contact</div>
                <p className="text-sm">{BRAND.supportPhone}</p>
                <p className="mt-1 text-sm">Hyderabad - Vijayawada - Tirupati</p>
              </div>
            </div>
            <div className="border-t border-white/10 py-4 text-center text-xs text-slate-400">
              Prototype: sample data and sample prices
            </div>
          </footer>
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat on WhatsApp"
            className="fixed bottom-4 right-4 z-20 flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-3 text-sm font-bold text-white shadow-[var(--shadow-lg)] transition hover:brightness-95"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 .9c.3.1.5.2.5.3.1.2.1.8-.1 1.3Z" />
            </svg>
            <span className="hidden sm:inline">Chat</span>
          </a>
          <CompareBar />
        </CartProvider>
      </CompareProvider>
    </ViewerProvider>
  );
}
