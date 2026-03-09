import type { Listing } from "./Listing";

export type UnitFamily = "weight" | "count";
export type CanonicalUnit = "kg" | "piece";

export type NormalizedListing = {
    id: string;
    vendorId: string;
    rawInput: string;
    originalProduct: string;
    normalizedProduct: string;
    productCategory: string;
    originalQuantity: number;
    originalUnit: string;
    originalPricePerUnit: number;
    canonicalQuantity: number;
    canonicalUnit: string;
    canonicalPricePerCanonicalUnit: number;
    assumptions: string[];
    status: string;
    createdAt: string;
    expirationDate: string;
};
