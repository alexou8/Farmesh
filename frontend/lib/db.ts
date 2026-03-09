import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type {
  Listing,
  ListingStatus,
  Match,
  MatchStatus,
  NormalizedListing,
  NormalizedRequest,
  Request,
  RequestStatus,
} from "@/types";

const DEFAULT_PRODUCT_CATEGORY = "EMPTY";

async function getDbClient() {
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

function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = toNullableNumber(value);
  return parsed === null ? fallback : parsed;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

type ListingRow = {
  id: string;
  vendor_id: string;
  raw_input: string | null;
  status: string;
  created_at: string;
  expiration_date: string;
  original_product: string;
  original_quantity: number | string;
  original_unit: string;
  original_price_per_unit: number | string;
  normalized_product: string | null;
  product_category: string | null;
  canonical_quantity: number | string | null;
  canonical_unit: string | null;
  canonical_price_per_canonical_unit: number | string | null;
  assumptions: string[] | null;
};

type RequestRow = {
  id: string;
  buyer_id: string;
  raw_input: string | null;
  status: string;
  created_at: string;
  original_product: string;
  original_quantity: number | string;
  original_unit: string;
  original_price_per_unit: number | string;
  normalized_product: string | null;
  product_category: string | null;
  canonical_quantity: number | string | null;
  canonical_unit: string | null;
  canonical_price_per_canonical_unit: number | string | null;
  needed_date: string | null;
  assumptions: string[] | null;
};

type MatchRow = {
  id: string;
  listing_id: string;
  request_id: string;
  score: number | string;
  product: string;
  reason: string;
  status: string;
  created_at: string;
};

const ACTIVE_MATCH_STATUSES: MatchStatus[] = [
  "PROPOSED",
  "AWAITING_CONFIRMATION",
  "CONFIRMED",
  "FULFILLED",
];

type ListingMatchDetailsRow = {
  id: string;
  vendor_id: string;
  original_product: string;
  normalized_product: string | null;
  original_quantity: number | string;
  original_unit: string;
  original_price_per_unit: number | string;
  canonical_quantity: number | string | null;
  canonical_unit: string | null;
  canonical_price_per_canonical_unit: number | string | null;
};

type RequestMatchDetailsRow = {
  id: string;
  buyer_id: string;
  original_product: string;
  normalized_product: string | null;
  original_quantity: number | string;
  original_unit: string;
  original_price_per_unit: number | string;
  canonical_quantity: number | string | null;
  canonical_unit: string | null;
  canonical_price_per_canonical_unit: number | string | null;
};

type UserProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  business_name: string | null;
  phone: string | null;
};

function mapListingRow(row: ListingRow): Listing {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    rawInput: row.raw_input ?? "",
    product: row.normalized_product ?? row.original_product,
    quantity: toNumber(row.canonical_quantity ?? row.original_quantity),
    unit: row.canonical_unit ?? row.original_unit,
    pricePerUnit: toNumber(row.canonical_price_per_canonical_unit ?? row.original_price_per_unit),
    status: row.status as ListingStatus,
    createdAt: row.created_at,
    expirationDate: row.expiration_date,
  };
}

export function mapNormalizedListingRow(row: ListingRow): NormalizedListing {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    rawInput: row.raw_input ?? "",
    originalProduct: row.original_product,
    normalizedProduct: row.normalized_product ?? row.original_product,
    productCategory: row.product_category ?? DEFAULT_PRODUCT_CATEGORY,
    originalQuantity: toNumber(row.original_quantity),
    originalUnit: row.original_unit,
    originalPricePerUnit: toNumber(row.original_price_per_unit),
    canonicalQuantity: toNumber(row.canonical_quantity ?? row.original_quantity),
    canonicalUnit: row.canonical_unit ?? row.original_unit,
    canonicalPricePerCanonicalUnit: toNumber(
      row.canonical_price_per_canonical_unit ?? row.original_price_per_unit
    ),
    assumptions: toStringArray(row.assumptions),
    status: row.status,
    createdAt: row.created_at,
    expirationDate: row.expiration_date,
  };
}

function mapRequestRow(row: RequestRow): Request {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    rawInput: row.raw_input ?? "",
    product: row.normalized_product ?? row.original_product,
    quantity: toNumber(row.canonical_quantity ?? row.original_quantity),
    unit: row.canonical_unit ?? row.original_unit,
    pricePerUnit: toNumber(row.canonical_price_per_canonical_unit ?? row.original_price_per_unit),
    status: row.status as RequestStatus,
    createdAt: row.created_at,
    neededDate: row.needed_date ?? undefined,
  };
}

export function mapNormalizedRequestRow(row: RequestRow): NormalizedRequest {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    rawInput: row.raw_input ?? "",
    originalProduct: row.original_product,
    normalizedProduct: row.normalized_product ?? row.original_product,
    productCategory: row.product_category ?? DEFAULT_PRODUCT_CATEGORY,
    originalQuantity: toNumber(row.original_quantity),
    originalUnit: row.original_unit,
    originalPricePerUnit: toNumber(row.original_price_per_unit),
    canonicalQuantity: toNumber(row.canonical_quantity ?? row.original_quantity),
    canonicalUnit: row.canonical_unit ?? row.original_unit,
    canonicalPricePerCanonicalUnit: toNumber(
      row.canonical_price_per_canonical_unit ?? row.original_price_per_unit
    ),
    assumptions: toStringArray(row.assumptions),
    status: row.status,
    createdAt: row.created_at,
    neededDate: row.needed_date ?? row.created_at,
  };
}

function mapMatchRow(row: MatchRow): Match {
  return {
    id: row.id,
    listingId: row.listing_id,
    requestId: row.request_id,
    score: toNumber(row.score),
    product: row.product,
    reason: row.reason,
    status: row.status as MatchStatus,
    createdAt: row.created_at,
  };
}

async function enrichMatches(matches: Match[]): Promise<Match[]> {
  if (matches.length === 0) return [];

  const supabase = await getDbClient();
  const listingIds = [...new Set(matches.map((match) => match.listingId))];
  const requestIds = [...new Set(matches.map((match) => match.requestId))];

  const [listingResult, requestResult] = await Promise.all([
    supabase
      .from("listings")
      .select(
        "id, vendor_id, original_product, normalized_product, original_quantity, original_unit, original_price_per_unit, canonical_quantity, canonical_unit, canonical_price_per_canonical_unit"
      )
      .in("id", listingIds),
    supabase
      .from("requests")
      .select(
        "id, buyer_id, original_product, normalized_product, original_quantity, original_unit, original_price_per_unit, canonical_quantity, canonical_unit, canonical_price_per_canonical_unit"
      )
      .in("id", requestIds),
  ]);

  if (listingResult.error || requestResult.error) {
    console.warn("[db] Failed to enrich matches with listing/request details.", {
      listingError: listingResult.error?.message ?? null,
      requestError: requestResult.error?.message ?? null,
    });
    return matches;
  }

  const listings = (listingResult.data ?? []) as ListingMatchDetailsRow[];
  const requests = (requestResult.data ?? []) as RequestMatchDetailsRow[];

  const listingById = new Map(listings.map((listing) => [listing.id, listing]));
  const requestById = new Map(requests.map((request) => [request.id, request]));

  const userIds = new Set<string>();
  for (const listing of listings) userIds.add(listing.vendor_id);
  for (const request of requests) userIds.add(request.buyer_id);

  let profileById = new Map<string, UserProfileRow>();
  if (userIds.size > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("users")
      .select("id, name, email, business_name, phone")
      .in("id", [...userIds]);

    if (profilesError) {
      console.warn("[db] Failed to enrich matches with user profiles.", profilesError.message);
    } else {
      profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    }
  }

  return matches.map((match) => {
    const listing = listingById.get(match.listingId);
    const request = requestById.get(match.requestId);
    const vendorProfile = listing ? profileById.get(listing.vendor_id) : null;
    const buyerProfile = request ? profileById.get(request.buyer_id) : null;

    return {
      ...match,
      listing: listing
        ? {
          id: listing.id,
          vendorId: listing.vendor_id,
          product: listing.normalized_product ?? listing.original_product,
          quantity: toNumber(listing.canonical_quantity ?? listing.original_quantity),
          unit: listing.canonical_unit ?? listing.original_unit,
          pricePerUnit: toNumber(listing.canonical_price_per_canonical_unit ?? listing.original_price_per_unit),
        }
        : null,
      request: request
        ? {
          id: request.id,
          buyerId: request.buyer_id,
          product: request.normalized_product ?? request.original_product,
          quantity: toNumber(request.canonical_quantity ?? request.original_quantity),
          unit: request.canonical_unit ?? request.original_unit,
          pricePerUnit: toNumber(request.canonical_price_per_canonical_unit ?? request.original_price_per_unit),
        }
        : null,
      vendor: listing
        ? {
          id: listing.vendor_id,
          name: vendorProfile?.name ?? null,
          email: vendorProfile?.email ?? null,
          businessName: vendorProfile?.business_name ?? null,
          phone: vendorProfile?.phone ?? null,
        }
        : null,
      buyer: request
        ? {
          id: request.buyer_id,
          name: buyerProfile?.name ?? null,
          email: buyerProfile?.email ?? null,
          businessName: buyerProfile?.business_name ?? null,
          phone: buyerProfile?.phone ?? null,
        }
        : null,
    };
  });
}

function buildListingInsertPayload(listing: Listing | NormalizedListing) {
  if ("normalizedProduct" in listing) {
    return {
      vendor_id: listing.vendorId,
      raw_input: listing.rawInput ?? "",
      status: listing.status,
      expiration_date: listing.expirationDate,
      original_product: listing.originalProduct,
      original_quantity: listing.originalQuantity,
      original_unit: listing.originalUnit,
      original_price_per_unit: listing.originalPricePerUnit,
      normalized_product: listing.normalizedProduct,
      product_category: listing.productCategory,
      canonical_quantity: listing.canonicalQuantity,
      canonical_unit: listing.canonicalUnit,
      canonical_price_per_canonical_unit: listing.canonicalPricePerCanonicalUnit,
      assumptions: listing.assumptions,
    };
  }

  return {
    vendor_id: listing.vendorId,
    raw_input: listing.rawInput ?? "",
    status: listing.status,
    expiration_date: listing.expirationDate,
    original_product: listing.product,
    original_quantity: listing.quantity,
    original_unit: listing.unit,
    original_price_per_unit: listing.pricePerUnit,
    normalized_product: listing.product,
    product_category: DEFAULT_PRODUCT_CATEGORY,
    canonical_quantity: null,
    canonical_unit: null,
    canonical_price_per_canonical_unit: null,
    assumptions: [],
  };
}

function buildRequestInsertPayload(request: Request | NormalizedRequest) {
  if ("normalizedProduct" in request) {
    return {
      buyer_id: request.buyerId,
      raw_input: request.rawInput ?? "",
      status: request.status,
      needed_date: request.neededDate ?? null,
      original_product: request.originalProduct,
      original_quantity: request.originalQuantity,
      original_unit: request.originalUnit,
      original_price_per_unit: request.originalPricePerUnit,
      normalized_product: request.normalizedProduct,
      product_category: request.productCategory,
      canonical_quantity: request.canonicalQuantity,
      canonical_unit: request.canonicalUnit,
      canonical_price_per_canonical_unit: request.canonicalPricePerCanonicalUnit,
      assumptions: request.assumptions,
    };
  }

  return {
    buyer_id: request.buyerId,
    raw_input: request.rawInput ?? "",
    status: request.status,
    needed_date: request.neededDate ?? null,
    original_product: request.product,
    original_quantity: request.quantity,
    original_unit: request.unit,
    original_price_per_unit: request.pricePerUnit,
    normalized_product: request.product,
    product_category: DEFAULT_PRODUCT_CATEGORY,
    canonical_quantity: null,
    canonical_unit: null,
    canonical_price_per_canonical_unit: null,
    assumptions: [],
  };
}

export async function getListings(): Promise<Listing[]> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch listings: ${error.message}`);
  return (data ?? []).map((row) => mapListingRow(row as ListingRow));
}

export async function getNormalizedListings(): Promise<NormalizedListing[]> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch listings: ${error.message}`);
  return (data ?? []).map((row) => mapNormalizedListingRow(row as ListingRow));
}

export async function getNormalizedListingsByVendor(vendorId: string): Promise<NormalizedListing[]> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch normalized listings for vendor ${vendorId}: ${error.message}`);
  }

  return (data ?? []).map((row) => mapNormalizedListingRow(row as ListingRow));
}

export async function getListingsByVendor(vendorId: string): Promise<Listing[]> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch listings for vendor ${vendorId}: ${error.message}`);
  }

  return (data ?? []).map((row) => mapListingRow(row as ListingRow));
}

export async function getListingById(id: string): Promise<Listing | null> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch listing ${id}: ${error.message}`);
  if (!data) return null;
  return mapListingRow(data as ListingRow);
}

export async function insertListing(listing: Listing | NormalizedListing): Promise<Listing> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("listings")
    .insert(buildListingInsertPayload(listing))
    .select("*")
    .single();

  if (error) throw new Error(`Failed to insert listing: ${error.message}`);
  return mapListingRow(data as ListingRow);
}

export async function deleteMatchesByListingId(listingId: string): Promise<{
  count: number;
  requestIds: string[];
}> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("matches")
    .delete()
    .eq("listing_id", listingId)
    .select("request_id");

  if (error) throw new Error(`Failed to delete matches for listing ${listingId}: ${error.message}`);
  const requestIds = [
    ...new Set(
      (data ?? [])
        .map((row) => row.request_id)
        .filter((value): value is string => typeof value === "string")
    ),
  ];

  return {
    count: (data ?? []).length,
    requestIds,
  };
}

export async function deleteListingById(id: string): Promise<void> {
  const supabase = await getDbClient();
  const { error } = await supabase.from("listings").delete().eq("id", id);

  if (error) throw new Error(`Failed to delete listing ${id}: ${error.message}`);
}

export async function updateListingStatus(
  id: string,
  status: ListingStatus
): Promise<void> {
  const supabase = await getDbClient();
  const { error } = await supabase.from("listings").update({ status }).eq("id", id);

  if (error) throw new Error(`Failed to update listing ${id}: ${error.message}`);
}

// Functions for updating runtime normalization have been removed since normalization is now done at creation time only.

export async function getRequests(): Promise<Request[]> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch requests: ${error.message}`);
  return (data ?? []).map((row) => mapRequestRow(row as RequestRow));
}

export async function getNormalizedRequests(): Promise<NormalizedRequest[]> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch requests: ${error.message}`);
  return (data ?? []).map((row) => mapNormalizedRequestRow(row as RequestRow));
}

export async function getNormalizedRequestsByBuyer(buyerId: string): Promise<NormalizedRequest[]> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch normalized requests for buyer ${buyerId}: ${error.message}`);
  }

  return (data ?? []).map((row) => mapNormalizedRequestRow(row as RequestRow));
}

export async function getRequestsByBuyer(buyerId: string): Promise<Request[]> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch requests for buyer ${buyerId}: ${error.message}`);
  }

  return (data ?? []).map((row) => mapRequestRow(row as RequestRow));
}

export async function getRequestById(id: string): Promise<Request | null> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch request ${id}: ${error.message}`);
  if (!data) return null;
  return mapRequestRow(data as RequestRow);
}

export async function insertRequest(request: Request | NormalizedRequest): Promise<Request> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("requests")
    .insert(buildRequestInsertPayload(request))
    .select("*")
    .single();

  if (error) throw new Error(`Failed to insert request: ${error.message}`);
  return mapRequestRow(data as RequestRow);
}

export async function deleteMatchesByRequestId(requestId: string): Promise<{
  count: number;
  listingIds: string[];
}> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("matches")
    .delete()
    .eq("request_id", requestId)
    .select("listing_id");

  if (error) throw new Error(`Failed to delete matches for request ${requestId}: ${error.message}`);
  const listingIds = [
    ...new Set(
      (data ?? [])
        .map((row) => row.listing_id)
        .filter((value): value is string => typeof value === "string")
    ),
  ];

  return {
    count: (data ?? []).length,
    listingIds,
  };
}

export async function deleteRequestById(id: string): Promise<void> {
  const supabase = await getDbClient();
  const { error } = await supabase.from("requests").delete().eq("id", id);

  if (error) throw new Error(`Failed to delete request ${id}: ${error.message}`);
}

export async function updateRequestStatus(
  id: string,
  status: RequestStatus
): Promise<void> {
  const supabase = await getDbClient();
  const { error } = await supabase.from("requests").update({ status }).eq("id", id);

  if (error) throw new Error(`Failed to update request ${id}: ${error.message}`);
}

// Functions for updating runtime normalization have been removed since normalization is now done at creation time only.

export async function getMatches(): Promise<Match[]> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("score", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch matches: ${error.message}`);
  return (data ?? []).map((row) => mapMatchRow(row as MatchRow));
}

export async function getMatchesWithDetails(): Promise<Match[]> {
  const matches = await getMatches();
  return enrichMatches(matches);
}

export async function getMatchByIdWithDetails(id: string): Promise<Match | null> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch match ${id}: ${error.message}`);
  if (!data) return null;

  const [match] = await enrichMatches([mapMatchRow(data as MatchRow)]);
  return match ?? null;
}

export async function getMatchesByVendor(vendorId: string): Promise<Match[]> {
  const supabase = await getDbClient();

  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select("id")
    .eq("vendor_id", vendorId);

  if (listingsError) {
    throw new Error(
      `Failed to fetch listing ids for vendor ${vendorId}: ${listingsError.message}`
    );
  }

  const listingIds = (listings ?? []).map((row) => row.id);
  if (listingIds.length === 0) return [];

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .in("listing_id", listingIds)
    .order("score", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch vendor matches: ${error.message}`);
  return (data ?? []).map((row) => mapMatchRow(row as MatchRow));
}

export async function getMatchesByVendorWithDetails(vendorId: string): Promise<Match[]> {
  const matches = await getMatchesByVendor(vendorId);
  return enrichMatches(matches);
}

export async function getMatchesByBuyer(buyerId: string): Promise<Match[]> {
  const supabase = await getDbClient();

  const { data: requests, error: requestsError } = await supabase
    .from("requests")
    .select("id")
    .eq("buyer_id", buyerId);

  if (requestsError) {
    throw new Error(
      `Failed to fetch request ids for buyer ${buyerId}: ${requestsError.message}`
    );
  }

  const requestIds = (requests ?? []).map((row) => row.id);
  if (requestIds.length === 0) return [];

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .in("request_id", requestIds)
    .order("score", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch buyer matches: ${error.message}`);
  return (data ?? []).map((row) => mapMatchRow(row as MatchRow));
}

export async function getMatchesByBuyerWithDetails(buyerId: string): Promise<Match[]> {
  const matches = await getMatchesByBuyer(buyerId);
  return enrichMatches(matches);
}

export async function insertMatch(match: Match): Promise<Match> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("matches")
    .insert({
      id: match.id,
      listing_id: match.listingId,
      request_id: match.requestId,
      score: match.score,
      product: match.product,
      reason: match.reason,
      status: match.status,
      created_at: match.createdAt,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Failed to insert match: ${error.message}`);
  return mapMatchRow(data as MatchRow);
}

export async function updateMatchStatus(
  id: string,
  status: MatchStatus
): Promise<void> {
  const supabase = await getDbClient();
  const { error } = await supabase.from("matches").update({ status }).eq("id", id);

  if (error) throw new Error(`Failed to update match ${id}: ${error.message}`);
}

export async function deleteMatchById(id: string): Promise<void> {
  const supabase = await getDbClient();
  const { error } = await supabase.from("matches").delete().eq("id", id);

  if (error) throw new Error(`Failed to delete match ${id}: ${error.message}`);
}

export async function hasActiveMatchesForListing(listingId: string): Promise<boolean> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("matches")
    .select("id")
    .eq("listing_id", listingId)
    .in("status", ACTIVE_MATCH_STATUSES)
    .limit(1);

  if (error) throw new Error(`Failed to check active matches for listing ${listingId}: ${error.message}`);
  return (data ?? []).length > 0;
}

export async function hasActiveMatchesForRequest(requestId: string): Promise<boolean> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("matches")
    .select("id")
    .eq("request_id", requestId)
    .in("status", ACTIVE_MATCH_STATUSES)
    .limit(1);

  if (error) throw new Error(`Failed to check active matches for request ${requestId}: ${error.message}`);
  return (data ?? []).length > 0;
}

export async function getMatchStatusesForListing(listingId: string): Promise<MatchStatus[]> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("matches")
    .select("status")
    .eq("listing_id", listingId);

  if (error) {
    throw new Error(`Failed to fetch match statuses for listing ${listingId}: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => row.status)
    .filter((status): status is MatchStatus => typeof status === "string")
    .map((status) => status as MatchStatus);
}

export async function getMatchStatusesForRequest(requestId: string): Promise<MatchStatus[]> {
  const supabase = await getDbClient();
  const { data, error } = await supabase
    .from("matches")
    .select("status")
    .eq("request_id", requestId);

  if (error) {
    throw new Error(`Failed to fetch match statuses for request ${requestId}: ${error.message}`);
  }

  return (data ?? [])
    .map((row) => row.status)
    .filter((status): status is MatchStatus => typeof status === "string")
    .map((status) => status as MatchStatus);
}
