// Auth service — wired to Supabase via server actions + browser client.
//
// Server actions handle signIn, signUp, signOut (they run on the server
// and use redirect() internally).
//
// getUser() uses the browser Supabase client to fetch the current session
// and profile from public.users — used by client components like AppNav.

import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types";

function isSupabaseLockAbortError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "AbortError" ||
    error.message.includes("Lock broken by another request") ||
    error.message.includes("steal")
  );
}

async function getAuthUserWithRetry() {
  const supabase = createClient();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      return user;
    } catch (error) {
      if (!isSupabaseLockAbortError(error) || attempt === 1) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 80));
    }
  }

  return null;
}

/**
 * Fetch the currently authenticated user and their profile from public.users.
 * Returns null if not authenticated.
 */
export async function getUser(): Promise<User | null> {
  const supabase = createClient();

  let authUser = null;

  try {
    authUser = await getAuthUserWithRetry();
  } catch (error) {
    if (!isSupabaseLockAbortError(error)) {
      throw error;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    authUser = session?.user ?? null;
  }

  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, email, type, business_name, phone")
    .eq("id", authUser.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    name: profile.name ?? "",
    email: profile.email ?? authUser.email ?? "",
    type: profile.type ?? "buyer",
    businessName: profile.business_name ?? "",
    phone: profile.phone ?? "",
  };
}
