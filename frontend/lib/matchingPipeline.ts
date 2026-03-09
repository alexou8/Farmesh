import {
  coordinateProposedMatch,
  type CoordinationFrontendEvent,
} from "@backend/agents/coordinationAgent";
import { proposeMatches } from "@backend/agents/matchingAgent";
import {
  getNormalizedListings,
  getNormalizedListingsByVendor,
  getMatches,
  getNormalizedRequests,
  getNormalizedRequestsByBuyer,
} from "@/lib/db";
import type {
  Match,
  NormalizedListing,
  NormalizedRequest,
} from "@/types";

export type MatchingPipelineResult = {
  success: boolean;
  matchesFound: number;
  matches: Match[];
  coordinationEvents: CoordinationFrontendEvent[];
  message?: string;
  debug: {
    normalizationError: string | null;
    llmError: string | null;
    model: string;
    provider: string;
    responseStatus: string | null;
    hadToolCalls: boolean;
    usedTextFallback: boolean;
    usedDeterministicFallback: boolean;
  };
};

export async function runMatchingPipeline(params?: {
  role?: "farmer" | "buyer";
  userId?: string;
}): Promise<MatchingPipelineResult> {
  const isFarmer = params?.role === "farmer" && params?.userId;
  const isBuyer = params?.role === "buyer" && params?.userId;

  let rawListings: NormalizedListing[] = [];
  let rawRequests: NormalizedRequest[] = [];

  console.log(`[MatchingPipeline] Running matching pipeline for role: ${params?.role ?? "all"}, userId: ${params?.userId ?? "all"}`);

  if (isFarmer) {
    rawListings = await getNormalizedListingsByVendor(params.userId!);
    rawRequests = await getNormalizedRequests();
  } else if (isBuyer) {
    rawListings = await getNormalizedListings();
    rawRequests = await getNormalizedRequestsByBuyer(params.userId!);
  } else {
    rawListings = await getNormalizedListings();
    rawRequests = await getNormalizedRequests();
  }

  const listings = rawListings.filter((listing) => listing.status === "OPEN");
  const requests = rawRequests.filter((request) => request.status === "OPEN");

  console.log(`[MatchingPipeline] Fetched raw data: ${rawListings.length} listings, ${rawRequests.length} requests`);
  console.log(`[MatchingPipeline] Active data: ${listings.length} OPEN listings, ${requests.length} OPEN requests`);

  if (listings.length === 0 || requests.length === 0) {
    return {
      success: true,
      matchesFound: 0,
      matches: [],
      coordinationEvents: [],
      message: "No open listings or requests to match.",
      debug: {
        normalizationError: null,
        llmError: null,
        model: process.env.MATCHING_MODEL ?? "gemini-2.5-flash",
        provider: process.env.MATCHING_PROVIDER ?? "google",
        responseStatus: null,
        hadToolCalls: false,
        usedTextFallback: false,
        usedDeterministicFallback: false,
      },
    };
  }

  const existingMatches = await getMatches();
  const existingPairs = new Set(
    existingMatches.map((match) => `${match.listingId}::${match.requestId}`)
  );

  console.log(`[MatchingPipeline] Found ${existingPairs.size} existing match pairs. Proposing new matches...`);

  const matching = await proposeMatches({
    listings: listings,
    requests: requests,
    existingPairs,
  });

  console.log(`[MatchingPipeline] Matching engine returned ${matching.matches.length} proposed matches.`);
  console.log(`[MatchingPipeline] Engine debug:`, matching.debug);

  const listingById = new Map(listings.map((listing) => [listing.id, listing]));
  const requestById = new Map(requests.map((request) => [request.id, request]));

  const usedListingIds = new Set<string>();
  const usedRequestIds = new Set<string>();
  const persistedMatches: Match[] = [];
  const coordinationEvents: CoordinationFrontendEvent[] = [];

  for (const proposed of matching.matches) {
    const listing = listingById.get(proposed.listingId);
    const request = requestById.get(proposed.requestId);

    if (!listing || !request) continue;
    if (usedListingIds.has(listing.id) || usedRequestIds.has(request.id)) continue;

    const key = `${listing.id}::${request.id}`;
    if (existingPairs.has(key)) continue;

    const quantity = Number.isFinite(proposed.quantity) && proposed.quantity > 0
      ? proposed.quantity
      : Math.min(listing.canonicalQuantity ?? listing.originalQuantity, request.canonicalQuantity ?? request.originalQuantity);

    const coordinated = await coordinateProposedMatch({
      vendorId: listing.vendorId,
      buyerId: request.buyerId,
      listingId: listing.id,
      requestId: request.id,
      product: proposed.product || listing.normalizedProduct || listing.originalProduct,
      quantity,
      score: proposed.score,
      reason: proposed.reason,
    });

    persistedMatches.push(coordinated.match);
    coordinationEvents.push(coordinated.frontendEvent);
    usedListingIds.add(listing.id);
    usedRequestIds.add(request.id);
    existingPairs.add(key);
  }

  console.log(`[MatchingPipeline] Pipeline completed. Persisted ${persistedMatches.length} coordinated matches.`);

  return {
    success: true,
    matchesFound: persistedMatches.length,
    matches: persistedMatches,
    coordinationEvents,
    debug: {
      ...matching.debug,
      normalizationError: null,
    },
  };
}
