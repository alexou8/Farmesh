import { NextRequest, NextResponse } from "next/server";
import { normalize as normalizeListing } from "@backend/agents/listingNormAgent";
import { getListings, getListingsByVendor, insertListing } from "@/lib/db";
import { runMatchingPipeline } from "@/lib/matchingPipeline";
import { createClient } from "@/lib/supabase/server";
import type { Listing, NormalizedListing } from "@/types";

function parsePositiveNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseNonNegativeNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function toIsoDate(value: unknown, fallbackIso: string): string {
  if (typeof value !== "string" || value.trim().length === 0) return fallbackIso;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallbackIso;
  return date.toISOString();
}

// GET /api/listings?vendorId=<uuid>
export async function GET(req: NextRequest) {
  const vendorId = req.nextUrl.searchParams.get("vendorId");
  const listings = vendorId
    ? await getListingsByVendor(vendorId)
    : await getListings();

  return NextResponse.json(listings);
}

// POST /api/listings
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const vendorId = user?.id ?? body.vendorId;
    if (typeof vendorId !== "string" || vendorId.length === 0) {
      return NextResponse.json({ error: "vendorId is required" }, { status: 400 });
    }

    if (typeof body.product !== "string" || body.product.trim().length === 0) {
      return NextResponse.json({ error: "product is required" }, { status: 400 });
    }

    const quantity = parsePositiveNumber(body.quantity);
    if (quantity === null) {
      return NextResponse.json(
        { error: "quantity must be a positive number" },
        { status: 400 }
      );
    }

    const pricePerUnit = parseNonNegativeNumber(body.pricePerUnit);
    if (pricePerUnit === null) {
      return NextResponse.json(
        { error: "pricePerUnit must be a non-negative number" },
        { status: 400 }
      );
    }

    const defaultExpiryIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const listingInput: Listing = {
      id: "",
      vendorId,
      rawInput: typeof body.rawInput === "string" ? body.rawInput : "",
      product: body.product.trim(),
      quantity,
      unit: typeof body.unit === "string" && body.unit.trim().length > 0 ? body.unit.trim() : "lb",
      pricePerUnit,
      status: "OPEN",
      expirationDate: toIsoDate(body.expirationDate, defaultExpiryIso),
      createdAt: new Date().toISOString(),
    };

    let listingToPersist: Listing | NormalizedListing = listingInput;
    let normalizationWarning: string | null = null;

    try {
      const jsonString = JSON.stringify(listingInput);
      const normalized = await normalizeListing(jsonString);
      if (normalized) {
        listingToPersist = normalized;
      } else {
        normalizationWarning = "Normalization agent returned no result.";
      }
    } catch (error) {
      normalizationWarning =
        error instanceof Error ? error.message : "Normalization failed";
    }

    const created = await insertListing(listingToPersist);

    let matchResult: Awaited<ReturnType<typeof runMatchingPipeline>> | null = null;
    let matchingWarning: string | null = null;

    try {
      matchResult = await runMatchingPipeline({ role: "farmer", userId: vendorId });
    } catch (error) {
      matchingWarning =
        error instanceof Error ? error.message : "Auto matching failed";
    }

    return NextResponse.json(
      {
        listing: created,
        autoMatch: matchResult,
        warnings: {
          normalization: normalizationWarning,
          matching: matchingWarning,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
