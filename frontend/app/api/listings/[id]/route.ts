import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  deleteListingById,
  deleteMatchesByListingId,
  getListingById,
  getMatchStatusesForRequest,
  updateRequestStatus,
} from "@/lib/db";
import type { MatchStatus, RequestStatus } from "@/types";

function deriveRequestStatus(statuses: MatchStatus[]): RequestStatus {
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

async function updateRequestStatusSafe(id: string, status: RequestStatus) {
  try {
    await updateRequestStatus(id, status);
  } catch (error) {
    if (
      (status === "CONFIRMED" || status === "FULFILLED") &&
      isEnumMissingValue(error, "request_status", status)
    ) {
      await updateRequestStatus(id, "MATCHED");
      return;
    }
    throw error;
  }
}

// DELETE /api/listings/[id]
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

    const listing = await getListingById(id);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.vendorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const removed = await deleteMatchesByListingId(id);
    await Promise.all(
      removed.requestIds.map(async (requestId) => {
        const matchStatuses = await getMatchStatusesForRequest(requestId);
        await updateRequestStatusSafe(requestId, deriveRequestStatus(matchStatuses));
      })
    );
    await deleteListingById(id);

    return NextResponse.json({
      success: true,
      removedMatches: removed.count,
      listingId: id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
