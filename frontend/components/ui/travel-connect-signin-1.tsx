"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  ShoppingBasket,
  Sprout,
} from "lucide-react";
import type { UserType } from "@/types";
import { login } from "@/app/actions/login";
import { signup } from "@/app/actions/signup";

type Mode = "signin" | "signup";

function FarmeshHeroImage({ isFarmer }: { isFarmer: boolean }) {
  const image = isFarmer
    ? "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1600&q=80"
    : "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1600&q=80";

  const overlay = isFarmer
    ? "linear-gradient(180deg, hsl(143 24% 16% / 0.2) 0%, hsl(143 24% 12% / 0.6) 100%)"
    : "linear-gradient(180deg, hsl(30 36% 18% / 0.2) 0%, hsl(30 36% 12% / 0.62) 100%)";

  return (
    <div className="relative h-full w-full overflow-hidden border" style={{ borderColor: "var(--border-soft)" }}>
      <img
        src={image}
        alt={isFarmer ? "Farmer carrying local produce" : "Fresh produce prepared for local buyers"}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0" style={{ background: overlay }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
    </div>
  );
}

export default function TravelConnectSignin() {
  const searchParams = useSearchParams();
  const initialRole: UserType =
    searchParams.get("role") === "buyer" ? "buyer" : "farmer";

  const [role, setRole] = useState<UserType>(initialRole);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isFarmer = role === "farmer";
  const accent = isFarmer
    ? {
        solid: "#16a34a",
        soft: "#f0fdf4",
        text: "#166534",
        border: "#bbf7d0",
        link: "#15803d",
      }
    : {
        solid: "#d97706",
        soft: "#fffbeb",
        text: "#92400e",
        border: "#fde68a",
        link: "#b45309",
      };

  const inputBase =
    "w-full border px-4 py-2.5 text-sm font-sans outline-none transition-colors duration-200 focus:border-[var(--border-focus)]";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const result = await login({ email, password });
        if (result?.error) setError(result.error);
      } else {
        const result = await signup({
          name,
          email,
          password,
          type: role,
          businessName,
          phone,
        });
        if (result?.error) setError(result.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen px-6 py-8 lg:px-12"
      style={{
        background: "linear-gradient(180deg, hsl(40 33% 97%) 0%, hsl(36 24% 93%) 100%)",
      }}
    >
      <header className="mx-auto mb-8 flex w-full max-w-7xl items-center justify-between">
        <Link
          href="/"
          className="link-underline flex items-center gap-1.5 text-xs font-medium tracking-[0.15em] uppercase transition-colors duration-300"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center bg-green-600">
            <Sprout className="h-4 w-4 text-white" />
          </div>
          <span
            className="font-serif text-xl tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            Farmesh
          </span>
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-7xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="grid w-full overflow-hidden border bg-[var(--surface-base)] shadow-[0_24px_58px_-38px_hsl(30_10%_15%_/_0.48)] lg:grid-cols-[1.08fr_1fr]"
          style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-base)" }}
        >
          <div className="hidden min-h-[700px] border-r p-10 xl:p-12 lg:block" style={{ borderColor: "var(--border-soft)" }}>
            <div className="mb-8">
              <p
                className="mb-3 text-[11px] font-semibold tracking-[0.3em] uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                Local sourcing
              </p>
              <h2 className="font-serif text-5xl leading-[0.95]" style={{ color: "var(--foreground)" }}>
                Built for local
                <br />
                food connections
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed" style={{ color: "var(--text-subtle)" }}>
                From farm harvest to kitchen prep, Farmesh helps growers and buyers move local food through one shared marketplace.
              </p>
            </div>

            <div className="relative h-[430px]">
              <FarmeshHeroImage isFarmer={isFarmer} />
            </div>

            <div className="mt-8 border px-5 py-4 text-sm leading-relaxed" style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-card)", color: "var(--text-muted)" }}>
              {isFarmer
                ? "Farmer accounts can post inventory and review matched buyers."
                : "Buyer accounts can post requests and review ranked farm matches."}
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--text-faint)" }}>
              <span className="inline-flex items-center gap-2">
                {isFarmer ? (
                  <Sprout className="h-3.5 w-3.5" style={{ color: "#16a34a" }} />
                ) : (
                  <ShoppingBasket className="h-3.5 w-3.5" style={{ color: "#d97706" }} />
                )}
                {isFarmer ? "Farmer mode" : "Buyer mode"}
              </span>
              <span className="text-right">Canadian farm-to-business network</span>
            </div>
          </div>

          <div className="min-h-[700px] p-8 sm:p-10 md:p-12 xl:p-14">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
            >
              <p
                className="mb-2 text-[11px] font-semibold tracking-[0.3em] uppercase"
                style={{ color: "var(--text-muted)" }}
              >
                {mode === "signin" ? "Sign in" : "Create account"}
              </p>
              <h1 className="font-serif text-5xl leading-[0.96]" style={{ color: "var(--foreground)" }}>
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {mode === "signin"
                  ? "Sign in to continue to your Farmesh dashboard."
                  : "Set up your role and start matching local supply and demand."}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("farmer")}
                  className="flex items-center justify-center gap-2 border px-4 py-3 text-xs font-semibold tracking-[0.14em] uppercase transition-all duration-200"
                  style={{
                    borderColor: isFarmer ? accent.border : "var(--border-soft)",
                    backgroundColor: isFarmer ? accent.soft : "var(--surface-card)",
                    color: isFarmer ? accent.text : "var(--text-muted)",
                  }}
                >
                  <Sprout className="h-4 w-4" />
                  Farmer
                </button>
                <button
                  type="button"
                  onClick={() => setRole("buyer")}
                  className="flex items-center justify-center gap-2 border px-4 py-3 text-xs font-semibold tracking-[0.14em] uppercase transition-all duration-200"
                  style={{
                    borderColor: !isFarmer ? accent.border : "var(--border-soft)",
                    backgroundColor: !isFarmer ? accent.soft : "var(--surface-card)",
                    color: !isFarmer ? accent.text : "var(--text-muted)",
                  }}
                >
                  <ShoppingBasket className="h-4 w-4" />
                  Buyer
                </button>
              </div>

              <div className="mt-7 flex gap-6 border-b pb-2" style={{ borderColor: "var(--border-soft)" }}>
                {(["signin", "signup"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className="border-b-2 pb-2 text-xs font-semibold tracking-[0.14em] uppercase transition-colors duration-200"
                    style={{
                      borderColor: mode === value ? accent.solid : "transparent",
                      color: mode === value ? "var(--foreground)" : "var(--text-muted)",
                    }}
                  >
                    {value === "signin" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <AnimatePresence initial={false}>
                  {mode === "signup" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div>
                        <label
                          htmlFor="name"
                          className="mb-1.5 block text-[11px] font-semibold tracking-[0.15em] uppercase"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Full Name
                        </label>
                        <input
                          id="name"
                          type="text"
                          required
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder="John Doe"
                          className={inputBase}
                          style={{
                            borderColor: "var(--border-subtle)",
                            backgroundColor: "var(--surface-base)",
                            color: "var(--foreground)",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="businessName"
                          className="mb-1.5 block text-[11px] font-semibold tracking-[0.15em] uppercase"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {isFarmer ? "Farm Name" : "Business Name"}
                          <span
                            className="ml-1 font-normal tracking-normal normal-case"
                            style={{ color: "var(--text-faint)" }}
                          >
                            (optional)
                          </span>
                        </label>
                        <input
                          id="businessName"
                          type="text"
                          value={businessName}
                          onChange={(event) => setBusinessName(event.target.value)}
                          placeholder={isFarmer ? "e.g. Green Acres Farm" : "e.g. Local Kitchen"}
                          className={inputBase}
                          style={{
                            borderColor: "var(--border-subtle)",
                            backgroundColor: "var(--surface-base)",
                            color: "var(--foreground)",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="phone"
                          className="mb-1.5 block text-[11px] font-semibold tracking-[0.15em] uppercase"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Phone
                          <span
                            className="ml-1 font-normal tracking-normal normal-case"
                            style={{ color: "var(--text-faint)" }}
                          >
                            (optional)
                          </span>
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          placeholder="(555) 123-4567"
                          className={inputBase}
                          style={{
                            borderColor: "var(--border-subtle)",
                            backgroundColor: "var(--surface-base)",
                            color: "var(--foreground)",
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-[11px] font-semibold tracking-[0.15em] uppercase"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className={inputBase}
                    style={{
                      borderColor: "var(--border-subtle)",
                      backgroundColor: "var(--surface-base)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-[11px] font-semibold tracking-[0.15em] uppercase"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      className={`${inputBase} pr-11`}
                      style={{
                        borderColor: "var(--border-subtle)",
                        backgroundColor: "var(--surface-base)",
                        color: "var(--foreground)",
                      }}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 px-3"
                      style={{ color: "var(--text-subtle)" }}
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.99 }}
                  whileHover={{ filter: "brightness(0.96)" }}
                  className="w-full px-4 py-3 text-xs font-semibold tracking-[0.15em] uppercase text-white transition-colors duration-200 disabled:opacity-60"
                  style={{ backgroundColor: accent.solid }}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    {loading
                      ? "Just a moment…"
                      : mode === "signin"
                        ? `Sign in as ${role}`
                        : `Create ${role} account`}
                    {!loading && <ArrowRight className="h-3.5 w-3.5" />}
                  </span>
                </motion.button>

                <p className="pt-1 text-center text-sm" style={{ color: "var(--text-subtle)" }}>
                  {mode === "signin" ? "Need an account?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                    className="font-semibold transition-colors duration-200"
                    style={{ color: accent.link }}
                  >
                    {mode === "signin" ? "Create one" : "Sign in"}
                  </button>
                </p>
              </form>

              <div
                className="mt-7 border p-3 text-sm"
                style={{
                  borderColor: "var(--border-soft)",
                  backgroundColor: "var(--surface-card)",
                  color: "var(--text-muted)",
                }}
              >
                {isFarmer
                  ? "Farmer accounts post supply and review buyer matches."
                  : "Buyer accounts post requests and confirm vendor matches."}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
