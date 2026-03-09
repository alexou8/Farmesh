export type { UserType, User } from "./User";
export type { ListingStatus, Listing } from "./Listing";
export type {
    UnitFamily,
    CanonicalUnit,
    NormalizedListing,
} from "./NormalizedListing";
export type {
    MatchStatus,
    Match,
    MatchPartyDetails,
    MatchListingDetails,
    MatchRequestDetails,
} from "./Match";
export type { RequestStatus, Request } from "./Request";
export type { NormalizedRequest } from "./NormalizedRequest";

export type Notification = {
    id: string;
    message: string;
    time: string;
    read: boolean;
};

export type Order = {
    id: string;
    title: string;
    vendors: string[];
    quantity: string;
    status: "Pending" | "In Transit" | "Delivered" | "Cancelled";
    deliveryTarget: string;
};
