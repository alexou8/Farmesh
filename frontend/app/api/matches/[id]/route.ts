import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  deleteMatchById,
  getMatchByIdWithDetails,
  getMatchStatusesForListing,
  getMatchStatusesForRequest,
  updateListingStatus,
  updateMatchStatus,
  updateRequestStatus,
} from "@/lib/db";
import type { ListingStatus, MatchStatus, RequestStatus } from "@/types";

const VALID_MATCH_STATUSES: MatchStatus[] = [
  "PROPOSED",
  "AWAITING_CONFIRMATION",
  "CONFIRMED",
  "FULFILLED",
  "REJECTED",
];

const ALLOWED_STATUS_TRANSITIONS: Record<MatchStatus, MatchStatus[]> = {
  PROPOSED: ["CONFIRMED", "REJECTED"],
  AWAITING_CONFIRMATION: ["CONFIRMED", "REJECTED"],
  CONFIRMED: ["FULFILLED"],
  FULFILLED: [],
  REJECTED: [],
};

function isValidMatchStatus(value: string): value is MatchStatus {
  return VALID_MATCH_STATUSES.includes(value as MatchStatus);
}

function isAuthorizedForMatch(userId: string, match: NonNullable<Awaited<ReturnType<typeof getMatchByIdWithDetails>>>) {
  const vendorId = match.listing?.vendorId;
  const buyerId = match.request?.buyerId;
  return userId === vendorId || userId === buyerId;
}

async function resolveAuthorizedMatch(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  }

  const match = await getMatchByIdWithDetails(id);
  if (!match) {
    return { error: NextResponse.json({ error: "Match not found" }, { status: 404 }) } as const;
  }

  if (!isAuthorizedForMatch(user.id, match)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  }

  return { user, match } as const;
}

function deriveParentStatus(statuses: MatchStatus[]): ListingStatus | RequestStatus {
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

async function syncParentStatuses(listingId: string, requestId: string) {
  const [listingMatchStatuses, requestMatchStatuses] = await Promise.all([
    getMatchStatusesForListing(listingId),
    getMatchStatusesForRequest(requestId),
  ]);

  await Promise.all([
    updateListingStatusSafe(listingId, deriveParentStatus(listingMatchStatuses) as ListingStatus),
    updateRequestStatusSafe(requestId, deriveParentStatus(requestMatchStatuses) as RequestStatus),
  ]);
}

// PATCH /api/matches/[id]  { status: "CONFIRMED" | "FULFILLED" | "REJECTED" | ... }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await resolveAuthorizedMatch(id);
    if ("error" in authResult) return authResult.error;

    const body = (await req.json().catch(() => ({}))) as { status?: string };
    const status = body.status;

    if (typeof status !== "string" || !isValidMatchStatus(status)) {
      return NextResponse.json({ error: "Invalid match status" }, { status: 400 });
    }

    if (authResult.match.status !== status) {
      const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[authResult.match.status] ?? [];
      if (!allowedTransitions.includes(status)) {
        return NextResponse.json(
          {
            error: `Cannot transition match from ${authResult.match.status} to ${status}`,
          },
          { status: 409 }
        );
      }
    }

    let effectiveStatus: MatchStatus = status;
    try {
      await updateMatchStatus(id, status);
    } catch (error) {
      // Older DB schemas may not include match_status = FULFILLED yet.
      if (status === "FULFILLED" && isEnumMissingValue(error, "match_status", "FULFILLED")) {
        effectiveStatus = "CONFIRMED";
        await updateMatchStatus(id, effectiveStatus);
      } else {
        throw error;
      }
    }

    const listingId = authResult.match.listingId;
    const requestId = authResult.match.requestId;
    await syncParentStatuses(listingId, requestId);

    return NextResponse.json({
      success: true,
      matchId: id,
      status: effectiveStatus,
      requestedStatus: status,
      downgraded: effectiveStatus !== status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/matches/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await resolveAuthorizedMatch(id);
    if ("error" in authResult) return authResult.error;

    const listingId = authResult.match.listingId;
    const requestId = authResult.match.requestId;

    await deleteMatchById(id);
    await syncParentStatuses(listingId, requestId);

    return NextResponse.json({ success: true, matchId: id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
