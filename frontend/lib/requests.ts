import type { NormalizedRequest, Request } from "@/types";
import { insertRequest as insertRequestRecord } from "@/lib/db";

export function createRequestObject({
  buyerId,
  product,
  quantity,
  unit,
  pricePerUnit,
  neededDate,
  description,
}: {
  buyerId: string;
  product: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  neededDate: string;
  description?: string;
}): Request {
  return {
    id: "",
    buyerId,
    rawInput: description,
    product,
    quantity,
    unit,
    pricePerUnit,
    status: "OPEN",
    neededDate,
  };
}

export async function insertRequest(request: Request | NormalizedRequest) {
  return insertRequestRecord(request);
}
