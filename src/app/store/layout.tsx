import Link from "next/link";
import { CartProvider } from "@/components/cart";
import { CartLink } from "./cart-link";
import { BRAND } from "@/lib/brand";
import { getCategories } from "@/lib/data/catalog";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  return (
    <CartProvider>
      <header className="sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="text-xl font-extrabold tracking-tight">
            <span className="text-accent">Rack</span>
            {BRAND.name.replace("Rack", "")}
          </Link>
          <nav className="hidden gap-5 text-sm font-medium md:flex">
            {categories.map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`} className="text-muted hover:text-foreground">
                {c.name}
              </Link>
            ))}
          </nav>
          <CartLink />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 text-sm text-muted">
          <span>{BRAND.name} - {BRAND.tagline}</span>
          <span>Prototype: sample data and sample prices</span>
        </div>
      </footer>
    </CartProvider>
  );
}
