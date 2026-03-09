import type { Listing, NormalizedListing } from "@/types";
import { insertListing as insertListingRecord } from "@/lib/db";

export function createListingObject({
  vendorId,
  product,
  quantity,
  unit,
  pricePerUnit,
  expirationDate,
  description,
}: {
  vendorId: string;
  product: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  expirationDate: string;
  description?: string;
}): Listing {
  return {
    id: "",
    vendorId,
    rawInput: description,
    product,
    quantity,
    unit,
    pricePerUnit,
    status: "OPEN",
    expirationDate,
  };
}

export async function insertListing(listing: Listing | NormalizedListing) {
  return insertListingRecord(listing);
}
