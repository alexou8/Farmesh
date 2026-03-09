import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { User, UserType } from "@/types";

type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  type: string | null;
  business_name: string | null;
  phone: string | null;
};

const PROFILE_SELECT = "id, name, email, type, business_name, phone";

async function getProfileDbClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceRoleKey) {
    return createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return createClient();
}

function toUser(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name ?? "",
    email: row.email ?? "",
    type: (row.type as UserType) ?? "buyer",
    businessName: row.business_name ?? "",
    phone: row.phone ?? "",
  };
}

function parseRequiredString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new Error(`${field} is required`);
  }
  const parsed = value.trim();
  if (!parsed) {
    throw new Error(`${field} is required`);
  }
  if (parsed.length > maxLength) {
    throw new Error(`${field} must be ${maxLength} characters or less`);
  }
  return parsed;
}

function parseOptionalString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }
  const parsed = value.trim();
  if (parsed.length > maxLength) {
    throw new Error(`${field} must be ${maxLength} characters or less`);
  }
  return parsed;
}

async function getAuthenticatedUserId() {
  const authClient = await createClient();
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error) {
    throw new Error(`Failed to authenticate user: ${error.message}`);
  }

  if (!user) {
    return null;
  }

  return user.id;
}

// GET /api/profile
export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getProfileDbClient();
    const { data, error } = await db.from("users").select(PROFILE_SELECT).eq("id", userId).single();

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch profile: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: toUser(data as ProfileRow) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/profile
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as
      | {
          name?: unknown;
          businessName?: unknown;
          phone?: unknown;
        }
      | null;

    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    let name: string;
    let businessName: string;
    let phone: string;

    try {
      name = parseRequiredString(body.name, "name", 120);
      businessName = parseOptionalString(body.businessName, "businessName", 160);
      phone = parseOptionalString(body.phone, "phone", 40);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid profile input";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const db = await getProfileDbClient();
    const { data, error } = await db
      .from("users")
      .update({
        name,
        business_name: businessName,
        phone,
      })
      .eq("id", userId)
      .select(PROFILE_SELECT)
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Failed to update profile: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: toUser(data as ProfileRow) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
