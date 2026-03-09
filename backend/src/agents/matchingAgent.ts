import { BackboardClient, type MessageResponse } from "backboard-sdk";
import type { NormalizedListing, NormalizedRequest } from "@/types";

const MATCHING_MODEL = process.env.MATCHING_MODEL ?? "gemini-2.5-flash";
const MATCHING_PROVIDER = process.env.MATCHING_PROVIDER ?? "google";

export type ProposedAgentMatch = {
  vendorId: string;
  buyerId: string;
  listingId: string;
  requestId: string;
  product: string;
  quantity: number;
  score: number;
  reason: string;
};

export type MatchingAgentDebug = {
  model: string;
  provider: string;
  responseStatus: string | null;
  hadToolCalls: boolean;
  usedTextFallback: boolean;
  usedDeterministicFallback: boolean;
  llmError: string | null;
};

export type MatchingAgentResult = {
  matches: ProposedAgentMatch[];
  debug: MatchingAgentDebug;
};

const WEIGHT_UNIT_TO_GRAMS: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  lb: 453.59237,
  lbs: 453.59237,
  pound: 453.59237,
  pounds: 453.59237,
  oz: 28.349523125,
  ounce: 28.349523125,
  ounces: 28.349523125,
};

const PRODUCT_FAMILIES = [
  ["salad greens", "baby greens", "mixed baby greens", "mixed greens", "spinach", "arugula"],
  ["cooking onions", "yellow onions", "white onions", "onions"],
  ["tomatoes", "roma tomatoes", "san marzano tomatoes", "heirloom tomatoes"],
  ["apples", "gala apples", "honeycrisp apples", "ambrosia apples", "mcintosh apples"],
] as const;

const PRODUCT_FAMILY_LOOKUP = new Map<string, Set<string>>();
for (const family of PRODUCT_FAMILIES) {
  const normalizedFamily = new Set(family.map((name) => normalizeText(name)));
  for (const name of normalizedFamily) {
    PRODUCT_FAMILY_LOOKUP.set(name, normalizedFamily);
  }
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUnit(unit: string): string {
  const normalized = normalizeText(unit);
  if (normalized === "lbs" || normalized === "pound" || normalized === "pounds") return "lb";
  if (normalized === "kilogram" || normalized === "kilograms") return "kg";
  if (normalized === "gram" || normalized === "grams") return "g";
  if (normalized === "ounce" || normalized === "ounces") return "oz";
  if (normalized === "cases") return "case";
  if (normalized === "bunches") return "bunch";
  if (normalized === "trays") return "tray";
  if (normalized === "baskets") return "basket";
  return normalized;
}

function tokenizeProduct(product: string): Set<string> {
  return new Set(
    normalizeText(product)
      .split(" ")
      .filter((token) => token.length >= 3)
  );
}

function evaluateProductCompatibility(listingProduct: string, requestProduct: string): {
  compatible: boolean;
  exact: boolean;
  family: boolean;
  tokenOverlap: number;
} {
  const normalizedListing = normalizeText(listingProduct);
  const normalizedRequest = normalizeText(requestProduct);

  if (!normalizedListing || !normalizedRequest) {
    return { compatible: false, exact: false, family: false, tokenOverlap: 0 };
  }

  if (normalizedListing === normalizedRequest) {
    return { compatible: true, exact: true, family: false, tokenOverlap: 1 };
  }

  const listingFamily = PRODUCT_FAMILY_LOOKUP.get(normalizedListing);
  const familyMatch = !!(listingFamily && listingFamily.has(normalizedRequest));
  if (familyMatch) {
    return { compatible: true, exact: false, family: true, tokenOverlap: 0.7 };
  }

  const listingTokens = tokenizeProduct(normalizedListing);
  const requestTokens = tokenizeProduct(normalizedRequest);
  if (listingTokens.size === 0 || requestTokens.size === 0) {
    return { compatible: false, exact: false, family: false, tokenOverlap: 0 };
  }

  let overlap = 0;
  for (const token of listingTokens) {
    if (requestTokens.has(token)) overlap += 1;
  }
  const tokenOverlap = overlap / Math.min(listingTokens.size, requestTokens.size);

  return {
    compatible: tokenOverlap >= 0.5,
    exact: false,
    family: false,
    tokenOverlap,
  };
}

function convertQuantity(quantity: number, fromUnit: string, toUnit: string): number | null {
  if (!Number.isFinite(quantity) || quantity <= 0) return null;

  const normalizedFrom = normalizeUnit(fromUnit);
  const normalizedTo = normalizeUnit(toUnit);
  if (!normalizedFrom || !normalizedTo) return null;
  if (normalizedFrom === normalizedTo) return quantity;

  const fromWeightFactor = WEIGHT_UNIT_TO_GRAMS[normalizedFrom];
  const toWeightFactor = WEIGHT_UNIT_TO_GRAMS[normalizedTo];
  if (fromWeightFactor && toWeightFactor) {
    return (quantity * fromWeightFactor) / toWeightFactor;
  }

  return null;
}

function convertPricePerUnit(pricePerFromUnit: number, fromUnit: string, toUnit: string): number | null {
  if (!Number.isFinite(pricePerFromUnit) || pricePerFromUnit < 0) return null;

  const normalizedFrom = normalizeUnit(fromUnit);
  const normalizedTo = normalizeUnit(toUnit);
  if (!normalizedFrom || !normalizedTo) return null;
  if (normalizedFrom === normalizedTo) return pricePerFromUnit;

  const fromWeightFactor = WEIGHT_UNIT_TO_GRAMS[normalizedFrom];
  const toWeightFactor = WEIGHT_UNIT_TO_GRAMS[normalizedTo];
  if (fromWeightFactor && toWeightFactor) {
    const pricePerGram = pricePerFromUnit / fromWeightFactor;
    return pricePerGram * toWeightFactor;
  }

  return null;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toProposedMatchArgs(value: unknown): ProposedAgentMatch | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;

  const vendorId = toNonEmptyString(candidate.vendorId);
  const buyerId = toNonEmptyString(candidate.buyerId);
  const listingId = toNonEmptyString(candidate.listingId);
  const requestId = toNonEmptyString(candidate.requestId);
  const product = toNonEmptyString(candidate.product);
  const reason = toNonEmptyString(candidate.reason);
  const quantity = toFiniteNumber(candidate.quantity);
  const score = toFiniteNumber(candidate.score);

  if (!vendorId || !buyerId || !listingId || !requestId || !product || !reason) return null;
  if (quantity === null || score === null) return null;
  if (quantity <= 0 || score < 0 || score > 100) return null;

  return {
    vendorId,
    buyerId,
    listingId,
    requestId,
    product,
    quantity,
    score,
    reason,
  };
}

function pairKey(listingId: string, requestId: string): string {
  return `${listingId}::${requestId}`;
}

function productKey(item: { originalProduct: string; normalizedProduct?: string | null }): string {
  const normalized = item.normalizedProduct;
  return typeof normalized === "string" && normalized.trim().length > 0
    ? normalized
    : item.originalProduct;
}

function getCanonicalComparable(
  item: {
    originalQuantity: number;
    originalUnit: string;
    originalPricePerUnit: number;
    canonicalQuantity?: number | null;
    canonicalUnit?: string | null;
    canonicalPricePerCanonicalUnit?: number | null;
  }
): {
  quantity: number;
  unit: string;
  pricePerUnit: number;
} | null {
  const canonicalQuantity = toFiniteNumber(item.canonicalQuantity);
  const canonicalPrice = toFiniteNumber(item.canonicalPricePerCanonicalUnit);
  const canonicalUnit = typeof item.canonicalUnit === "string" ? item.canonicalUnit : null;

  if (canonicalQuantity !== null && canonicalPrice !== null && canonicalUnit) {
    return {
      quantity: canonicalQuantity,
      unit: canonicalUnit,
      pricePerUnit: canonicalPrice,
    };
  }

  if (!Number.isFinite(item.originalQuantity) || !Number.isFinite(item.originalPricePerUnit)) {
    return null;
  }

  return {
    quantity: item.originalQuantity,
    unit: item.originalUnit,
    pricePerUnit: item.originalPricePerUnit,
  };
}

function normalizeExistingPairs(existingPairs?: Set<string> | string[]): Set<string> {
  if (!existingPairs) return new Set<string>();
  if (existingPairs instanceof Set) return new Set(existingPairs);
  return new Set(existingPairs);
}

async function runDeterministicFallback(
  listings: NormalizedListing[],
  requirements: NormalizedRequest[],
  seenPairs: Set<string>
): Promise<ProposedAgentMatch[]> {
  const fallbackMatches: ProposedAgentMatch[] = [];
  const usedListings = new Set<string>();
  const usedRequests = new Set<string>();

  for (const request of requirements) {
    if (usedRequests.has(request.id)) continue;

    const requestComparable = getCanonicalComparable(request);
    if (!requestComparable || requestComparable.quantity <= 0 || requestComparable.pricePerUnit < 0) continue;

    let bestCandidate:
      | {
        listing: NormalizedListing;
        score: number;
        matchedQuantity: number;
        reason: string;
      }
      | null = null;

    for (const listing of listings) {
      if (usedListings.has(listing.id)) continue;
      if (seenPairs.has(pairKey(listing.id, request.id))) continue;

      const product = evaluateProductCompatibility(productKey(listing), productKey(request));
      if (!product.compatible) continue;

      const listingComparable = getCanonicalComparable(listing);
      if (!listingComparable) continue;

      const listingQuantityInRequestUnit = convertQuantity(
        listingComparable.quantity,
        listingComparable.unit,
        requestComparable.unit
      );
      const listingPriceInRequestUnit = convertPricePerUnit(
        listingComparable.pricePerUnit,
        listingComparable.unit,
        requestComparable.unit
      );
      if (listingQuantityInRequestUnit === null || listingPriceInRequestUnit === null) continue;

      const quantityCoverage = listingQuantityInRequestUnit / requestComparable.quantity;
      if (quantityCoverage < 0.3) continue;

      if (listingPriceInRequestUnit > requestComparable.pricePerUnit * 1.2) continue;

      const productScore = product.exact
        ? 100
        : product.family
          ? 88
          : Math.max(70, Math.min(90, product.tokenOverlap * 100));
      const quantityScore = Math.min(100, quantityCoverage * 100);

      let priceScore = 100;
      if (requestComparable.pricePerUnit > 0 && listingPriceInRequestUnit > requestComparable.pricePerUnit) {
        const overBudgetRatio = listingPriceInRequestUnit / requestComparable.pricePerUnit - 1;
        priceScore = Math.max(70, 100 - (overBudgetRatio / 0.2) * 30);
      }

      const score = Number((productScore * 0.45 + quantityScore * 0.35 + priceScore * 0.2).toFixed(2));
      if (score < 70) continue;

      const matchedQuantity = Number(Math.min(listingQuantityInRequestUnit, requestComparable.quantity).toFixed(2));
      const reason = `${productKey(listing)} fits ${productKey(request)} with ${Math.round(quantityCoverage * 100)}% quantity coverage at ${listingPriceInRequestUnit.toFixed(2)} per ${requestComparable.unit}.`;

      if (!bestCandidate || score > bestCandidate.score) {
        bestCandidate = {
          listing,
          score,
          matchedQuantity,
          reason,
        };
      }
    }

    if (!bestCandidate) continue;

    const proposal: ProposedAgentMatch = {
      vendorId: bestCandidate.listing.vendorId,
      buyerId: request.buyerId,
      listingId: bestCandidate.listing.id,
      requestId: request.id,
      product: bestCandidate.listing.normalizedProduct ?? bestCandidate.listing.originalProduct,
      quantity: bestCandidate.matchedQuantity,
      score: bestCandidate.score,
      reason: bestCandidate.reason,
    };

    fallbackMatches.push(proposal);
    seenPairs.add(pairKey(proposal.listingId, proposal.requestId));
    usedListings.add(bestCandidate.listing.id);
    usedRequests.add(request.id);
  }

  return fallbackMatches;
}

export async function proposeMatches(params: {
  listings: NormalizedListing[];
  requests: NormalizedRequest[];
  existingPairs?: Set<string> | string[];
}): Promise<MatchingAgentResult> {
  console.log(`[MatchingAgent] Proposing matches between ${params.listings.length} listings and ${params.requests.length} requests.`);
  const seenPairs = normalizeExistingPairs(params.existingPairs);
  const proposedMatches: ProposedAgentMatch[] = [];

  let response: MessageResponse | null = null;
  let llmError: string | null = null;
  let usedTextFallback = false;
  let usedDeterministicFallback = false;

  const persistMatchIfValid = async (value: unknown): Promise<boolean> => {
    const args = toProposedMatchArgs(value);
    if (!args) return false;

    const key = pairKey(args.listingId, args.requestId);
    if (seenPairs.has(key)) return false;

    proposedMatches.push(args);
    seenPairs.add(key);
    return true;
  };

  const apiKey = process.env.BACKBOARD_API_KEY;

  if (apiKey) {
    const client = new BackboardClient({ apiKey });

    const assistant = await client.createAssistant({
      name: "Farmesh Matching Agent",
      system_prompt: `You are the Farmesh Matching Agent — the core fulfillment engine for a local food marketplace connecting farmers (vendors) and buyers.
Your job is to analyze standardized listings (supply) and standardized requests (demand) and identify high-quality fulfillment matches.

MATCHING CRITERIA:
1. Product Compatibility:
   - Exact matches (e.g., "gala apples" ↔ "gala apples")
   - Semantic/Family matches (e.g., "mixed greens" ↔ "spinach", "tomatoes" ↔ "roma tomatoes")
2. Quantity Coverage:
   - The listing must be able to supply at least 30% of the requested quantity (after unit conversion if necessary).
3. Price Feasibility:
   - The listing price per unit should ideally be equal to or lower than the buyer's budget.
   - Matches where the listing price exceeds the buyer's budget by up to 20% are acceptable but should score lower.

SCORING (0-100):
- Calculate a confidence score based on Product (45%), Quantity Coverage (35%), and Price Fit (20%).
- Only propose matches with a final score >= 70.

OUTPUT FORMAT:
You must strictly return a valid JSON array of match objects. Do not include any markdown formatting, explanations, or text outside the JSON array.

Return format:
vendorId: "string (from listing)",
buyerId: "string (from request)",
listingId: "string",
requestId: "string",
product: "string (the standardized product name)",
quantity: number (matched quantity, min of listing/request),
score: number (0-100),
reason: "1-2 sentence explanation of why this match works (price, quantity coverage, product fit)"
`,
    });

    const thread = await client.createThread(assistant.assistantId);

    try {
      const prompt = `
STANDARDIZED LISTINGS:
${JSON.stringify(params.listings, null, 2)}

STANDARDIZED REQUESTS:
${JSON.stringify(params.requests, null, 2)}
`;

      response = (await client.addMessage(thread.threadId, {
        content: prompt,
        llm_provider: MATCHING_PROVIDER,
        model_name: MATCHING_MODEL,
        memory: "Auto",
        stream: false,
      })) as MessageResponse;

      console.log(`[MatchingAgent] LLM responded with status: ${response.status}`);
      if (response.content) {
        console.log(`[MatchingAgent] Raw LLM content preview: ${response.content.substring(0, 200)}...`);
        try {
          const cleaned = response.content
            .replace(/```json\s*/gi, "")
            .replace(/```\s*/gi, "")
            .trim();

          const firstBracket = cleaned.indexOf("[");
          const lastBracket = cleaned.lastIndexOf("]");

          if (firstBracket !== -1 && lastBracket !== -1 && lastBracket >= firstBracket) {
            const jsonOnly = cleaned.slice(firstBracket, lastBracket + 1);
            const parsed = JSON.parse(jsonOnly) as unknown;

            if (Array.isArray(parsed)) {
              for (const entry of parsed) {
                await persistMatchIfValid(entry);
              }
            }

            if (proposedMatches.length > 0) {
              usedTextFallback = true;
            }
          }
        } catch (parseError) {
          console.warn(`[MatchingAgent] LLM parsing failed:`, parseError);
          // Ignore parsing errors and continue to deterministic fallback.
        }
      }
    } catch (error) {
      llmError = error instanceof Error ? error.message : "Unknown matching model error";
      console.error(`[MatchingAgent] LLM execution failed:`, llmError);
    } finally {
      try {
        await client.deleteAssistant(assistant.assistantId);
        await client.deleteThread(thread.threadId);
      } catch {
        // Best-effort cleanup only.
      }
    }
  } else {
    llmError = "Missing BACKBOARD_API_KEY in environment";
  }

  if (proposedMatches.length === 0) {
    console.log(`[MatchingAgent] No matches from LLM. Running deterministic fallback...`);
    const deterministicMatches = await runDeterministicFallback(
      params.listings,
      params.requests,
      seenPairs
    );

    if (deterministicMatches.length > 0) {
      console.log(`[MatchingAgent] Deterministic fallback found ${deterministicMatches.length} matches.`);
      proposedMatches.push(...deterministicMatches);
      usedDeterministicFallback = true;
    }
  }

  return {
    matches: proposedMatches,
    debug: {
      model: MATCHING_MODEL,
      provider: MATCHING_PROVIDER,
      responseStatus: response?.status ?? null,
      hadToolCalls: !!response?.toolCalls?.length,
      usedTextFallback,
      usedDeterministicFallback,
      llmError,
    },
  };
}
