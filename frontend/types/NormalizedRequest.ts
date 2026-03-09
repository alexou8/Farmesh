import type { Request } from "./Request";
import type { CanonicalUnit, UnitFamily } from "./NormalizedListing";

export type NormalizedRequest = {
    id: string;
    buyerId: string;
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
    neededDate: string;
};
