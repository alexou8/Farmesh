"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import AppNav from "@/components/layout/AppNav";
import ProfileSettingsPanel from "@/components/profile/ProfileSettingsPanel";
import { getUser } from "@/lib/auth";
import type { User } from "@/types";

export default function FarmerProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const current = await getUser();
        if (!current || current.type !== "farmer") {
          if (mounted) {
            setStatusMessage("Farmer account required.");
            setLoading(false);
          }
          return;
        }

        if (!mounted) return;
        setUser(current);
      } catch (error) {
        if (mounted) {
          setStatusMessage(
            error instanceof Error ? error.message : "Failed to load profile"
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <AppNav unreadCount={0} />

      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-12">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <p className="mb-1 text-[11px] font-semibold tracking-[0.3em] uppercase text-green-600">
              Supply Management
            </p>
            <h1 className="font-serif text-3xl md:text-4xl" style={{ color: "var(--foreground)" }}>
              Farmer Profile
            </h1>
          </div>
          <Link
            href="/farmer"
            className="flex items-center gap-2 border px-4 py-2 text-xs font-semibold tracking-[0.12em] uppercase"
            style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
        </div>

        {statusMessage && (
          <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
            {statusMessage}
          </p>
        )}

        {loading ? (
          <p style={{ color: "var(--text-muted)" }}>Loading...</p>
        ) : (
          <ProfileSettingsPanel
            user={user}
            accentColor="green"
            roleLabel="Farmer"
            onSaved={(updated) => {
              setUser(updated);
              setStatusMessage("Profile updated successfully.");
            }}
          />
        )}
      </div>
    </div>
  );
}
