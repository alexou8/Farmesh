import { Listing, Match, Request, Notification, Order } from "@/types";

// ─── Farmer Listings ────────────────────────────────────────────────
export const farmerListings: Listing[] = [
    {
        id: "l1",
        vendorId: "f1",
        rawInput: "I have 60 lbs of baby greens available this week for Toronto restaurant and grocer buyers",
        product: "Mixed Baby Greens",
        quantity: 60,
        unit: "lb",
        pricePerUnit: 4.5,
        status: "OPEN",
        createdAt: "2026-03-05",
        expirationDate: "2026-03-12",
    },
    {
        id: "l2",
        vendorId: "f1",
        rawInput: "40 lbs certified organic spinach ready for wholesale",
        product: "Certified Organic Spinach",
        quantity: 40,
        unit: "lb",
        pricePerUnit: 5.25,
        status: "MATCHED",
        createdAt: "2026-03-03",
        expirationDate: "2026-03-10",
    },
    {
        id: "l3",
        vendorId: "f1",
        rawInput: "25 lbs fresh kale, available Thursday",
        product: "Fresh Kale",
        quantity: 25,
        unit: "lb",
        pricePerUnit: 3.75,
        status: "OPEN",
        createdAt: "2026-03-06",
        expirationDate: "2026-03-13",
    },
    {
        id: "l4",
        vendorId: "f1",
        rawInput: "30 lbs heirloom tomatoes, vine ripened",
        product: "Heirloom Tomatoes",
        quantity: 30,
        unit: "lb",
        pricePerUnit: 6.0,
        status: "EXPIRED",
        createdAt: "2026-02-25",
        expirationDate: "2026-03-04",
    },
];

// ─── Buyer Requests ─────────────────────────────────────────────────
export const buyerRequests: Request[] = [
    {
        id: "r1",
        buyerId: "b1",
        rawInput:
            "Need 100 lbs of high-quality salad greens for two Toronto restaurants, organic preferred, by Friday",
        product: "Salad Greens",
        quantity: 100,
        unit: "lb",
        pricePerUnit: 5.0,
        status: "OPEN",
        createdAt: "2026-03-05",
    },
    {
        id: "r2",
        buyerId: "b1",
        rawInput: "Looking for 50 lbs of spinach for a neighbourhood grocer produce section",
        product: "Spinach",
        quantity: 50,
        unit: "lb",
        pricePerUnit: 5.5,
        status: "MATCHED",
        createdAt: "2026-03-04",
    },
];

// ─── Farmer Matches ─────────────────────────────────────────────────
export const farmerMatches: Match[] = [
    {
        id: "m1",
        listingId: "l1",
        requestId: "r1",
        score: 92,
        product: "Mixed Baby Greens",
        reason:
            "Strong match — the buyer needs 100 lb salad greens and your 60 lb baby greens listing covers 60% of the request. Farmesh recommends this local Canadian match.",
        status: "PROPOSED",
        createdAt: "2026-03-06",
    },
    {
        id: "m2",
        listingId: "l2",
        requestId: "r2",
        score: 88,
        product: "Certified Organic Spinach",
        reason:
            "Your 40 lb organic spinach listing matches this buyer's 50 lb spinach request at 80% fulfillment.",
        status: "AWAITING_CONFIRMATION",
        createdAt: "2026-03-05",
    },
];

// ─── Buyer Matches ──────────────────────────────────────────────────
export const buyerMatches: Match[] = [
    {
        id: "m3",
        listingId: "l1",
        requestId: "r1",
        score: 95,
        product: "Salad Greens — Split Vendor Match",
        reason:
            "Farmesh combined two nearby farms to fulfill your 100 lb salad greens request: 60 lb baby greens from Green Acres Farm + 40 lb organic spinach from Maple Ridge Farm. Total: 100 lb at 100% fulfillment.",
        status: "PROPOSED",
        createdAt: "2026-03-06",
    },
    {
        id: "m4",
        listingId: "l2",
        requestId: "r1",
        score: 78,
        product: "Salad Greens — Single Vendor",
        reason:
            "Partial match: 40 lb certified organic spinach from Maple Ridge Farm covers 40% of your 100 lb request. Higher price per unit but certified organic quality.",
        status: "PROPOSED",
        createdAt: "2026-03-06",
    },
];

// ─── Buyer Orders ───────────────────────────────────────────────────
export const buyerOrders: Order[] = [
    {
        id: "o1",
        title: "Organic Spinach Bulk Order",
        vendors: ["Maple Ridge Farm"],
        quantity: "50 lb Spinach",
        status: "In Transit",
        deliveryTarget: "March 8, 2026",
    },
    {
        id: "o2",
        title: "Mixed Greens Weekly Supply",
        vendors: ["Green Acres Farm", "Niagara Valley Produce"],
        quantity: "80 lb Mixed Greens",
        status: "Delivered",
        deliveryTarget: "March 1, 2026",
    },
    {
        id: "o3",
        title: "Heirloom Tomato Order",
        vendors: ["Heritage Farms Ontario"],
        quantity: "30 lb Heirloom Tomatoes",
        status: "Pending",
        deliveryTarget: "March 10, 2026",
    },
];

// ─── Notifications ──────────────────────────────────────────────────
export const farmerNotifications: Notification[] = [
    {
        id: "n1",
        message: "New match proposal for your Mixed Baby Greens listing",
        time: "2 hours ago",
        read: false,
    },
    {
        id: "n2",
        message: "Your Organic Spinach listing was matched with a buyer",
        time: "1 day ago",
        read: true,
    },
    {
        id: "n3",
        message: "Listing for Heirloom Tomatoes has expired",
        time: "3 days ago",
        read: true,
    },
];

export const buyerNotifications: Notification[] = [
    {
        id: "n4",
        message: "Farmesh found a split-farm match for your salad greens request from local Canadian growers",
        time: "1 hour ago",
        read: false,
    },
    {
        id: "n5",
        message: "Your Organic Spinach order is in transit",
        time: "6 hours ago",
        read: false,
    },
    {
        id: "n6",
        message: "Order for Mixed Greens has been delivered",
        time: "6 days ago",
        read: true,
    },
];

// ─── AI Preview Samples ─────────────────────────────────────────────
export const parsedSupplyPreview = {
    product: "Baby Greens",
    quantity: 60,
    unit: "lb",
    pricePerUnit: 4.5,
};

export const parsedRequestPreview = {
    product: "Salad Greens",
    quantity: 100,
    unit: "lb",
    requiredBy: "Friday",
    organicPreferred: true,
    allowSubstitutions: true,
};
