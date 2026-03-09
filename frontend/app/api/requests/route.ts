import { NextRequest, NextResponse } from "next/server";
import { normalize as normalizeRequest } from "@backend/agents/requestNormAgent";
import { getRequests, getRequestsByBuyer, insertRequest } from "@/lib/db";
import { runMatchingPipeline } from "@/lib/matchingPipeline";
import { createClient } from "@/lib/supabase/server";
import type { Request, NormalizedRequest } from "@/types";

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

// GET /api/requests?buyerId=<uuid>
export async function GET(req: NextRequest) {
  const buyerId = req.nextUrl.searchParams.get("buyerId");
  const requests = buyerId
    ? await getRequestsByBuyer(buyerId)
    : await getRequests();

  return NextResponse.json(requests);
}

// POST /api/requests
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const buyerId = user?.id ?? body.buyerId;
    if (typeof buyerId !== "string" || buyerId.length === 0) {
      return NextResponse.json({ error: "buyerId is required" }, { status: 400 });
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

    const defaultNeededDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

    const requestInput: Request = {
      id: "",
      buyerId,
      rawInput: typeof body.rawInput === "string" ? body.rawInput : "",
      product: body.product.trim(),
      quantity,
      unit: typeof body.unit === "string" && body.unit.trim().length > 0 ? body.unit.trim() : "lb",
      pricePerUnit,
      status: "OPEN",
      neededDate: toIsoDate(body.neededDate, defaultNeededDate),
      createdAt: new Date().toISOString(),
    };

    let requestToPersist: Request | NormalizedRequest = requestInput;
    let normalizationWarning: string | null = null;

    try {
      const jsonString = JSON.stringify(requestInput);
      const normalized = await normalizeRequest(jsonString);
      if (normalized) {
        requestToPersist = normalized;
      } else {
        normalizationWarning = "Normalization agent returned no result.";
      }
    } catch (error) {
      normalizationWarning =
        error instanceof Error ? error.message : "Normalization failed";
    }

    const created = await insertRequest(requestToPersist);

    let matchResult: Awaited<ReturnType<typeof runMatchingPipeline>> | null = null;
    let matchingWarning: string | null = null;

    try {
      matchResult = await runMatchingPipeline({ role: "buyer", userId: buyerId });
    } catch (error) {
      matchingWarning =
        error instanceof Error ? error.message : "Auto matching failed";
    }

    return NextResponse.json(
      {
        request: created,
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
