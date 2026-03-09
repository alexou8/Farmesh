import { NextRequest, NextResponse } from "next/server";
import { generateMatchInsights } from "@backend/agents/coordinationAgent";
import {
  getListingsByVendor,
  getMatchByIdWithDetails,
  getMatchesByBuyerWithDetails,
  getMatchesByVendorWithDetails,
  getRequestsByBuyer,
} from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

type Viewer = "farmer" | "buyer";

function parseViewer(value: string | null): Viewer {
  return value === "buyer" ? "buyer" : "farmer";
}

// GET /api/matches/[id]/insights?viewer=farmer|buyer
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const viewer = parseViewer(req.nextUrl.searchParams.get("viewer"));

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const match = await getMatchByIdWithDetails(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const vendorId = match.listing?.vendorId ?? null;
    const buyerId = match.request?.buyerId ?? null;

    if (!vendorId || !buyerId) {
      return NextResponse.json(
        { error: "Match context unavailable for insights" },
        { status: 400 }
      );
    }

    if (user.id !== vendorId && user.id !== buyerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [vendorListings, buyerRequests, vendorMatches, buyerMatches] =
      await Promise.all([
        getListingsByVendor(vendorId),
        getRequestsByBuyer(buyerId),
        getMatchesByVendorWithDetails(vendorId),
        getMatchesByBuyerWithDetails(buyerId),
      ]);

    const relatedById = new Map<string, (typeof vendorMatches)[number]>();
    for (const entry of [...vendorMatches, ...buyerMatches]) {
      if (entry.id === match.id) continue;
      relatedById.set(entry.id, entry);
    }

    const relatedMatches = [...relatedById.values()]
      .filter(
        (entry) =>
          entry.listingId === match.listingId ||
          entry.requestId === match.requestId ||
          entry.product.toLowerCase() === match.product.toLowerCase()
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 20);

    const insights = await generateMatchInsights({
      match,
      viewer,
      relatedMatches,
      vendorListings,
      buyerRequests,
    });

    return NextResponse.json(insights);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
