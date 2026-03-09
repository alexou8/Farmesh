"use client";

import { useState } from "react";
import Link from "next/link";
import { Settings, Sprout, ShoppingCart } from "lucide-react";

export default function RoleSelector() {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium shadow-sm transition-all hover:shadow"
                style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-base)", color: "var(--text-muted)" }}
            >
                <Settings className="h-4 w-4" />
                Get Started
            </button>

            {open && (
                <div
                    className="absolute right-0 top-full z-10 mt-2 w-64 rounded-xl border p-2 shadow-lg"
                    style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-base)" }}
                >
                    <Link
                        href="/farmer"
                        className="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-green-50/80"
                        onClick={() => setOpen(false)}
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                            <Sprout className="h-5 w-5 text-green-700" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                                Continue as Farmer
                            </p>
                            <p className="text-xs" style={{ color: "var(--text-subtle)" }}>Manage your supply</p>
                        </div>
                    </Link>
                    <Link
                        href="/buyer"
                        className="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-amber-50/80"
                        onClick={() => setOpen(false)}
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                            <ShoppingCart className="h-5 w-5 text-amber-700" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                                Continue as Buyer
                            </p>
                            <p className="text-xs" style={{ color: "var(--text-subtle)" }}>Source from Canadian farms</p>
                        </div>
                    </Link>
                </div>
            )}
        </div>
    );
}
