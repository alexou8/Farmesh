export type MatchStatus =
    | "PROPOSED"
    | "AWAITING_CONFIRMATION"
    | "CONFIRMED"
    | "FULFILLED"
    | "REJECTED";

export type MatchPartyDetails = {
    id: string;
    name: string | null;
    email: string | null;
    businessName: string | null;
    phone: string | null;
};

export type MatchListingDetails = {
    id: string;
    vendorId: string;
    product: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
};

export type MatchRequestDetails = {
    id: string;
    buyerId: string;
    product: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
};

export type Match = {
    id: string;
    listingId: string;
    requestId: string;
    score: number;
    product: string;
    reason: string;
    status: MatchStatus;
    createdAt: string;
    vendor?: MatchPartyDetails | null;
    buyer?: MatchPartyDetails | null;
    listing?: MatchListingDetails | null;
    request?: MatchRequestDetails | null;
};
