export type ListingStatus =
    | "OPEN"
    | "MATCHED"
    | "CONFIRMED"
    | "FULFILLED"
    | "EXPIRED";

export type Listing = {
    id: string;
    vendorId: string;
    rawInput?: string;
    product: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    status: ListingStatus;
    createdAt?: string;
    expirationDate: string;
};
