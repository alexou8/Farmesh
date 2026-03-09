import Link from "next/link";
import { Sprout, ShoppingBasket, ArrowRight, ArrowDown } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--background)" }}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b transition-all duration-500"
        style={{ borderColor: "var(--border-soft)", backgroundColor: "hsl(40 33% 97% / 0.96)", backdropFilter: "blur(8px)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-8 w-8 items-center justify-center bg-green-600">
              <Sprout className="h-4 w-4 text-white" />
            </div>
            <span className="font-serif text-xl tracking-tight" style={{ color: "var(--foreground)" }}>
              Farmesh
            </span>
          </Link>

          <Link
            href="/auth"
            className="link-underline text-xs font-medium tracking-[0.15em] uppercase transition-colors duration-300"
            style={{ color: "var(--text-muted)" }}
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* ── Hero — Full Viewport ───────────────────────────────────────── */}
      <section className="relative h-[100svh] overflow-hidden">
        {/* Background image with Ken Burns */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80"
            alt="Golden farm fields at sunrise"
            className="animate-ken-burns h-[110%] w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, hsl(30 10% 15% / 0.35) 0%, hsl(30 10% 15% / 0.1) 40%, hsl(30 10% 15% / 0.55) 100%)" }}
          />
        </div>

        {/* Hero content */}
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-24 lg:px-12">
          <div className="animate-fade-in-up max-w-3xl">
            <p className="mb-6 text-[11px] font-semibold tracking-[0.3em] uppercase text-white/70">
              Built for Canadian Local Food Trade
            </p>
            <h1 className="font-serif mb-8 text-5xl leading-[0.9] tracking-tight text-white md:text-7xl lg:text-8xl">
              Canadian farms meet
              <br />
              <em className="font-normal not-italic" style={{ fontStyle: "italic" }}>local businesses</em>
            </h1>
            <p className="mb-10 max-w-lg text-base leading-relaxed text-white/75 md:text-lg">
              Connect local Canadian farmers with nearby restaurants, independent
              grocers, and other food buyers using fast matching that keeps food
              and revenue in local communities.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/auth?role=farmer"
                className="group inline-flex items-center gap-3 bg-green-600 px-8 py-4 text-xs font-semibold tracking-[0.15em] uppercase text-white transition-all duration-300 hover:bg-green-700"
              >
                I&apos;m a Farmer
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/auth?role=buyer"
                className="group inline-flex items-center gap-3 bg-amber-600 px-8 py-4 text-xs font-semibold tracking-[0.15em] uppercase text-white transition-all duration-300 hover:bg-amber-700"
              >
                I&apos;m a Buyer
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60">
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/60">Scroll</span>
            <ArrowDown className="animate-float h-4 w-4 text-white/60" />
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <section className="py-24 md:py-32" style={{ backgroundColor: "var(--background)" }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-16 text-center animate-fade-in">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.3em] uppercase text-green-600">
              How It Works
            </p>
            <h2 className="font-serif text-4xl md:text-5xl" style={{ color: "var(--foreground)" }}>
              Smarter Canadian sourcing
            </h2>
          </div>

          <div className="stagger-children grid gap-8 md:grid-cols-3">
            {[
              {
                num: "01",
                title: "Post Supply or Demand",
                body: "Farmers post available harvest. Restaurants and grocers share what they need in plain language or structured form.",
              },
              {
                num: "02",
                title: "AI Matches in Real Time",
                body: "Matching ranks quantity, distance, timing, and price to surface practical local Canadian pairings for both sides.",
              },
              {
                num: "03",
                title: "Confirm & Fulfill",
                body: "Accept a match, coordinate pickup or delivery, and track every order from farm to kitchen or shelf.",
              },
            ].map(({ num, title, body }) => (
              <div key={num} className="hover-lift border p-8" style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-card)" }}>
                <p className="mb-4 font-serif text-4xl text-green-600/30">{num}</p>
                <h3 className="font-serif mb-3 text-xl" style={{ color: "var(--foreground)" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role Cards ────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32" style={{ backgroundColor: "var(--surface-muted)" }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-16 text-center">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.3em] uppercase text-green-600">
              Get Started
            </p>
            <h2 className="font-serif text-4xl md:text-5xl" style={{ color: "var(--foreground)" }}>
              Choose your role
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Farmer card */}
            <Link
              href="/auth?role=farmer"
              className="hover-lift group flex flex-col gap-8 border p-10"
              style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-base)" }}
            >
              <div className="flex h-12 w-12 items-center justify-center bg-green-600">
                <Sprout className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold tracking-[0.3em] uppercase text-green-600">
                  For Farmers
                </p>
                <h3 className="font-serif mb-3 text-2xl md:text-3xl" style={{ color: "var(--foreground)" }}>
                  I&apos;m a Farmer
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Post available harvest and get matched with nearby Canadian
                  restaurants, independent grocers, and food businesses. Reduce
                  waste, move inventory faster, and build recurring local accounts.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-green-700">
                Get started
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </Link>

            {/* Buyer card */}
            <Link
              href="/auth?role=buyer"
              className="hover-lift group flex flex-col gap-8 border p-10"
              style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-base)" }}
            >
              <div className="flex h-12 w-12 items-center justify-center bg-amber-600">
                <ShoppingBasket className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold tracking-[0.3em] uppercase text-amber-600">
                  For Buyers
                </p>
                <h3 className="font-serif mb-3 text-2xl md:text-3xl" style={{ color: "var(--foreground)" }}>
                  I&apos;m a Buyer
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Source fresh produce from local Canadian farms for your
                  restaurant or small grocer. Post demand, review ranked matches,
                  and track fulfillment from farm to door.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-amber-700">
                Get started
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: "var(--foreground)", color: "var(--surface-base)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-12">
          <Link href="/" className="font-serif text-lg tracking-tight text-white/80">
            Farmesh
          </Link>
          <p className="text-xs" style={{ color: "hsl(40 33% 97% / 0.62)" }}>
            &copy; {new Date().getFullYear()} Farmesh — Strengthening Canada&apos;s local food economy
          </p>
          <Link
            href="/auth"
            className="text-xs tracking-[0.15em] uppercase transition-colors duration-300 hover:text-white"
            style={{ color: "hsl(40 33% 97% / 0.78)" }}
          >
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
