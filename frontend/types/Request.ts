export type RequestStatus =
    | "OPEN"
    | "MATCHED"
    | "CONFIRMED"
    | "FULFILLED";

export type Request = {
    id: string;
    buyerId: string;
    rawInput?: string;
    product: string;
    pricePerUnit: number;
    quantity: number;
    unit: string;
    status: RequestStatus;
    createdAt?: string;
    neededDate?: string;
};
