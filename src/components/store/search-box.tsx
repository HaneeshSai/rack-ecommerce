// Plain GET form: works without client JS and lands on /search?q=...
export function SearchBox({ className = "", defaultValue = "" }: { className?: string; defaultValue?: string }) {
  return (
    <form action="/search" method="get" role="search" className={className}>
      <div className="relative">
        <input
          name="q"
          defaultValue={defaultValue}
          placeholder="Search racks, accessories..."
          aria-label="Search products"
          className="w-full rounded-lg border border-line bg-white py-2 pl-3 pr-16 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <button className="absolute right-1 top-1 rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-brand-2">
          Search
        </button>
      </div>
    </form>
  );
}
