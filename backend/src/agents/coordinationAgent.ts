import { BackboardClient } from "backboard-sdk";
import { insertMatch, updateListingStatus, updateRequestStatus } from "@/lib/db";
import type { Listing, Match, Request } from "@/types";

const COORDINATION_FEEDBACK_MODEL =
  process.env.COORDINATION_FEEDBACK_MODEL ??
  process.env.MATCHING_MODEL ??
  "gemini-2.5-flash";

const COORDINATION_FEEDBACK_PROVIDER =
  process.env.COORDINATION_FEEDBACK_PROVIDER ??
  process.env.MATCHING_PROVIDER ??
  "google";

export type CoordinationFrontendEvent = {
  matchId: string;
  vendorId: string;
  buyerId: string;
  listingId: string;
  requestId: string;
  product: string;
  quantity: number;
  score: number;
  status: Match["status"];
  createdAt: string;
  summary: string;
};

export type CoordinationMatchInsightMetric = {
  label: string;
  value: string;
};

export type CoordinationMatchInsights = {
  summary: string;
  detail: string;
  metrics: CoordinationMatchInsightMetric[];
  history: string[];
  recommendations: string[];
  risks: string[];
};

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "n/a";
  return `${Math.round(value)}%`;
}

function formatCurrency(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "n/a";
  return `$${value.toFixed(2)}`;
}

function parseIsoTime(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDateLabel(value: string | undefined): string {
  if (!value) return "unknown date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "unknown date";
  return parsed.toLocaleDateString();
}

function buildFrontendEvent(
  match: Match,
  args: {
    vendorId: string;
    buyerId: string;
    listingId: string;
    requestId: string;
    product: string;
    quantity: number;
    score: number;
    reason: string;
  }
): CoordinationFrontendEvent {
  return {
    matchId: match.id,
    vendorId: args.vendorId,
    buyerId: args.buyerId,
    listingId: args.listingId,
    requestId: args.requestId,
    product: args.product,
    quantity: args.quantity,
    score: args.score,
    status: match.status,
    createdAt: match.createdAt,
    summary: `Proposed ${args.product} (${args.quantity}) at ${Math.round(args.score)}% score.`,
  };
}

export async function generateMatchInsights(args: {
  match: Match;
  viewer: "farmer" | "buyer";
  relatedMatches: Match[];
  vendorListings: Listing[];
  buyerRequests: Request[];
}): Promise<CoordinationMatchInsights> {
  const listing = args.match.listing ?? null;
  const request = args.match.request ?? null;
  const listingQuantity = listing ? Number(listing.quantity) : null;
  const requestQuantity = request ? Number(request.quantity) : null;
  const listingPrice = listing ? Number(listing.pricePerUnit) : null;
  const requestBudget = request ? Number(request.pricePerUnit) : null;

  const coveragePct =
    listingQuantity !== null &&
    requestQuantity !== null &&
    requestQuantity > 0
      ? (Math.min(listingQuantity, requestQuantity) / requestQuantity) * 100
      : null;

  const priceGapPct =
    listingPrice !== null &&
    requestBudget !== null &&
    requestBudget > 0
      ? ((requestBudget - listingPrice) / requestBudget) * 100
      : null;

  const related = [...args.relatedMatches].sort(
    (a, b) => parseIsoTime(b.createdAt) - parseIsoTime(a.createdAt)
  );
  const relatedConfirmed = related.filter((match) => match.status === "CONFIRMED").length;
  const relatedRejected = related.filter((match) => match.status === "REJECTED").length;
  const relatedPending = related.filter(
    (match) => match.status === "PROPOSED" || match.status === "AWAITING_CONFIRMATION"
  ).length;

  const sameProductHistory = related.filter(
    (match) => match.product.toLowerCase() === args.match.product.toLowerCase()
  ).length;

  const openListingCount = args.vendorListings.filter((entry) => entry.status === "OPEN").length;
  const openRequestCount = args.buyerRequests.filter((entry) => entry.status === "OPEN").length;

  const history = [
    `Similar history: ${sameProductHistory} past match(es) on ${args.match.product}.`,
    `Outcome trend: ${relatedConfirmed} confirmed, ${relatedRejected} rejected, ${relatedPending} still pending.`,
    ...related.slice(0, 3).map(
      (entry, index) =>
        `Recent #${index + 1}: ${entry.status} (${entry.score}% score) on ${formatDateLabel(entry.createdAt)}.`
    ),
  ];

  const recommendations =
    args.viewer === "farmer"
      ? [
          "Confirm packaging and delivery window before accepting to protect freshness.",
          "Offer a partial-fill fallback if demand changes after confirmation.",
          "Reference previous confirmed outcomes to justify response timing and pricing.",
        ]
      : [
          "Validate lead time and logistics before confirming this supplier.",
          "Use this score + price gap as a benchmark against alternative proposals.",
          "Ask for split fulfillment options if your demand may shift before needed date.",
        ];

  const risks = [
    coveragePct !== null && coveragePct < 70
      ? "Coverage is below 70%; additional suppliers may be required."
      : "Coverage level is strong for this demand profile.",
    priceGapPct !== null && priceGapPct < 0
      ? "Listing price is above target budget; margins may tighten."
      : "Listing price is within or below the target budget.",
    relatedRejected > relatedConfirmed
      ? "Historical rejection rate is elevated; verify constraints early."
      : "Historical acceptance trend is stable.",
  ];

  return {
    summary:
      args.viewer === "farmer"
        ? `This proposal maps your ${args.match.product} supply to buyer demand with ${args.match.score}% confidence.`
        : `This proposal maps supplier ${args.match.product} inventory to your request with ${args.match.score}% confidence.`,
    detail:
      args.viewer === "farmer"
        ? `Current coverage is ${formatPercent(coveragePct)} with price at ${formatCurrency(listingPrice)} against buyer target ${formatCurrency(requestBudget)}. You currently have ${openListingCount} open listing(s) and the buyer has ${openRequestCount} open request(s), which affects fulfillment priority.`
        : `Current coverage is ${formatPercent(coveragePct)} with offered price ${formatCurrency(listingPrice)} versus your budget ${formatCurrency(requestBudget)}. Supplier-side open inventory (${openListingCount}) and your active request load (${openRequestCount}) indicate current execution flexibility.`,
    metrics: [
      { label: "Match Score", value: `${Math.round(args.match.score)}%` },
      { label: "Coverage", value: formatPercent(coveragePct) },
      { label: "Unit Price", value: formatCurrency(listingPrice) },
      { label: "Budget Gap", value: formatPercent(priceGapPct) },
    ],
    history,
    recommendations,
    risks,
  };
}

async function sendMatchFeedbackToBackboard(
  match: Match,
  args: {
    vendorId: string;
    buyerId: string;
    listingId: string;
    requestId: string;
    product: string;
    quantity: number;
    score: number;
    reason: string;
  }
) {
  const apiKey = process.env.BACKBOARD_API_KEY;
  if (!apiKey) return;

  const client = new BackboardClient({ apiKey });

  let assistantId: string | null = null;
  let threadId: string | null = null;

  try {
    const assistant = await client.createAssistant({
      name: "Farmesh Match Feedback Agent",
      system_prompt: `You are the Farmesh Match Feedback Agent.

Your only job is to store and recall match outcomes between vendors and buyers for future normalization and matching.

Every message you receive will be a summary of a proposed match. Use memory to remember:
- Which vendor and buyer were involved.
- What product and quantity were proposed.
- The score and reason.
- The status of the match.

Keep responses short. Memory retention is the priority.`,
    });
    assistantId = assistant.assistantId;

    const thread = await client.createThread(assistant.assistantId);
    threadId = thread.threadId;

    const content = [
      `Match ID: ${match.id}`,
      `Vendor ID: ${args.vendorId}, Buyer ID: ${args.buyerId}`,
      `Listing ID: ${args.listingId}, Request ID: ${args.requestId}`,
      `Product: ${args.product}`,
      `Quantity: ${args.quantity}`,
      `Score: ${args.score}`,
      `Reason: ${args.reason}`,
      `Status: ${match.status}`,
      `CreatedAt: ${match.createdAt}`,
    ].join("\n");

    await client.addMessage(thread.threadId, {
      content,
      llm_provider: COORDINATION_FEEDBACK_PROVIDER,
      model_name: COORDINATION_FEEDBACK_MODEL,
      memory: "Auto",
      stream: false,
    });
  } catch (error) {
    console.warn("[CoordinationAgent] Failed to send match feedback to Backboard:", error);
  } finally {
    try {
      if (assistantId) {
        await client.deleteAssistant(assistantId);
      }
      if (threadId) {
        await client.deleteThread(threadId);
      }
    } catch {
      // Best-effort cleanup only.
    }
  }
}

/**
 * Coordination Agent — persists proposed matches and advances listing/request status.
 */
export async function handleProposedMatch(args: {
  vendorId: string;
  buyerId: string;
  listingId: string;
  requestId: string;
  product: string;
  quantity: number;
  score: number;
  reason: string;
}): Promise<Match> {
  const coordinated = await coordinateProposedMatch(args);
  return coordinated.match;
}

export async function coordinateProposedMatch(args: {
  vendorId: string;
  buyerId: string;
  listingId: string;
  requestId: string;
  product: string;
  quantity: number;
  score: number;
  reason: string;
}): Promise<{
  match: Match;
  frontendEvent: CoordinationFrontendEvent;
}> {
  const match: Match = {
    id: crypto.randomUUID(),
    listingId: args.listingId,
    requestId: args.requestId,
    score: args.score,
    product: args.product,
    reason: args.reason,
    status: "PROPOSED",
    createdAt: new Date().toISOString(),
  };

  const insertedMatch = await insertMatch(match);
  await updateListingStatus(args.listingId, "MATCHED");
  await updateRequestStatus(args.requestId, "MATCHED");

  void sendMatchFeedbackToBackboard(insertedMatch, args);

  return {
    match: insertedMatch,
    frontendEvent: buildFrontendEvent(insertedMatch, args),
  };
}
