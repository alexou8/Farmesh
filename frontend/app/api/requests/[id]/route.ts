import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  deleteMatchesByRequestId,
  deleteRequestById,
  getRequestById,
  getMatchStatusesForListing,
  updateListingStatus,
} from "@/lib/db";
import type { ListingStatus, MatchStatus } from "@/types";

function deriveListingStatus(statuses: MatchStatus[]): ListingStatus {
  if (statuses.includes("FULFILLED")) return "FULFILLED";
  if (statuses.includes("CONFIRMED")) return "CONFIRMED";
  if (
    statuses.includes("PROPOSED") ||
    statuses.includes("AWAITING_CONFIRMATION")
  ) {
    return "MATCHED";
  }
  return "OPEN";
}

function isEnumMissingValue(error: unknown, enumName: string, value: string): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("invalid input value for enum") &&
    message.includes(enumName.toLowerCase()) &&
    message.includes(value.toLowerCase())
  );
}

async function updateListingStatusSafe(id: string, status: ListingStatus) {
  try {
    await updateListingStatus(id, status);
  } catch (error) {
    if (
      (status === "CONFIRMED" || status === "FULFILLED") &&
      isEnumMissingValue(error, "listing_status", status)
    ) {
      await updateListingStatus(id, "MATCHED");
      return;
    }
    throw error;
  }
}

// DELETE /api/requests/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const request = await getRequestById(id);
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.buyerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const removed = await deleteMatchesByRequestId(id);
    await Promise.all(
      removed.listingIds.map(async (listingId) => {
        const matchStatuses = await getMatchStatusesForListing(listingId);
        await updateListingStatusSafe(listingId, deriveListingStatus(matchStatuses));
      })
    );
    await deleteRequestById(id);

    return NextResponse.json({
      success: true,
      removedMatches: removed.count,
      requestId: id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
