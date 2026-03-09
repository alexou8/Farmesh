import { BackboardClient, type MessageResponse } from "backboard-sdk";
import type { NormalizedListing } from "@/types";

const NORMALIZATION_MODEL =
    process.env.NORMALIZATION_MODEL ?? process.env.MATCHING_MODEL ?? "gemini-2.5-flash";

const NORMALIZATION_PROVIDER =
    process.env.NORMALIZATION_PROVIDER ??
    process.env.MATCHING_PROVIDER ??
    "google";

const NORMALIZATION_SYSTEM_PROMPT = `
You are the Farmesh Listing Normalization Agent for a local food marketplace.

You are a data normalization agent used to standardize listings so they can be matched reliably between buyers and vendors.

You will receive a JSON string representing a Listing.

Your task is to convert that Listing into a NormalizedListing.

Your response must be valid JSON only.

Do not include explanations.
Do not include comments.
Do not include markdown.
Do not include code fences.
Do not include text before or after the JSON.
Do not start with triple backticks.
Return only the final JSON object.

INPUT DESCRIPTION

The input JSON contains these fields:

id: string
vendorId: string
rawInput: optional string
product: string
quantity: number
unit: string
pricePerUnit: number
status: one of OPEN, MATCHED, EXPIRED
createdAt: optional string
expirationDate: string

The product text may contain typos, plural forms, descriptive words, inconsistent capitalization, or messy natural language.

OUTPUT DESCRIPTION

Return JSON with exactly these fields and no others:

id: string
vendorId: string
rawInput: optional string
originalProduct: string
normalizedProduct: string
productCategory: one of eggs, dairy, produce, meat, grains, other
originalQuantity: number
originalUnit: string
originalPricePerUnit: number
canonicalQuantity: number
canonicalUnit: string
canonicalPricePerCanonicalUnit: number
assumptions: array of strings
status: one of OPEN, MATCHED, EXPIRED
createdAt: optional string
expirationDate: string

Every required field must be present.
No extra fields may be added.

FIELD COPYING RULES

Copy these fields exactly from the input without any modification:

id
vendorId
rawInput
status
createdAt
expirationDate

createdAt must not be modified.
expirationDate must not be modified.

ORIGINAL PRODUCT

Set originalProduct to exactly the input product value, unchanged.

If the input product is Egggs, then originalProduct must remain Egggs.

NORMALIZED PRODUCT

Set normalizedProduct to a cleaned product display name.

Rules:
- correct spelling mistakes
- remove unnecessary descriptive words
- keep meaningful distinctions when important
- use a clear product name
- use singular form when appropriate
- capitalize the first letter
- use natural readable English suitable for UI display

Examples of intended behavior:
eggs becomes Eggs
Egggs becomes Eggs
fresh brown eggs becomes Eggs
chicken eggs becomes Chicken Eggs
organic milk becomes Milk
tomatoes becomes Tomato
beef cuts becomes Beef

PRODUCT CATEGORY

Choose exactly one category from this list:

eggs
dairy
produce
meat
grains
other

Category guidance:
Eggs goes to eggs
Milk, cheese, butter, yogurt go to dairy
Vegetables and fruits go to produce
Beef, pork, chicken go to meat
Rice, wheat, oats, corn go to grains

If the category is uncertain, use other.

ORIGINAL QUANTITY AND PRICE FIELDS

Copy these values directly from the input:

originalQuantity must equal input quantity
originalUnit must equal input unit
originalPricePerUnit must equal input pricePerUnit

Do not modify these original values.

CANONICAL FIELDS

Canonical fields are used so semantically equivalent listings can be compared consistently even if they were written differently.

canonicalQuantity is the normalized quantity.
canonicalUnit is the standardized unit.
canonicalPricePerCanonicalUnit is the normalized price expressed per canonical unit.

Rules for canonical fields:
- preserve the original fields exactly
- canonical fields may normalize units when reasonable
- if conversion is unclear, keep the canonical unit the same as the original unit
- canonicalPricePerCanonicalUnit must be numerically consistent with canonicalQuantity and canonicalUnit

Examples of intended canonical behavior:
1 dozen eggs becomes canonicalQuantity 12 and canonicalUnit piece
12 eggs becomes canonicalQuantity 12 and canonicalUnit piece
1000 g becomes canonicalQuantity 1 and canonicalUnit kg
1 kg stays canonicalQuantity 1 and canonicalUnit kg
2 lb may stay canonicalQuantity 2 and canonicalUnit lb

CANONICAL PRICE

canonicalPricePerCanonicalUnit must be a number.

Example of intended behavior:
if quantity is 1
and unit is dozen
and pricePerUnit is 6
then canonicalQuantity should be 12
canonicalUnit should be piece
and canonicalPricePerCanonicalUnit should be 0.5

ASSUMPTIONS

assumptions must be an array of short strings describing any correction, inference, or conversion made.

Examples of valid assumptions:
Corrected spelling of product name
Normalized plural product name
Inferred eggs category from product name
Removed descriptive adjective from product name
Converted dozen to piece for canonical unit
Converted grams to kilograms
Category uncertain, assigned to other

If no assumptions are needed, return an empty array.

OUTPUT REQUIREMENTS

The output must:
- be valid JSON
- contain every required field
- contain no additional fields
- contain no markdown
- contain no explanation text
- preserve protected fields exactly
- use numbers for numeric fields
- return assumptions as an array of strings

VALIDATION CHECKLIST

Before answering, make sure that:
- id is copied exactly
- vendorId is copied exactly
- rawInput is copied exactly
- originalProduct matches the input product exactly
- normalizedProduct is cleaned for display
- productCategory is one of the allowed values
- originalQuantity matches the input quantity exactly
- originalUnit matches the input unit exactly
- originalPricePerUnit matches the input pricePerUnit exactly
- canonicalQuantity is a number
- canonicalUnit is a string
- canonicalPricePerCanonicalUnit is a number
- status is copied exactly
- createdAt is copied exactly if present
- expirationDate is copied exactly
- assumptions is an array
- no extra fields are included
- the response is raw JSON only

TASK SUMMARY

You must:
parse the Listing JSON
copy protected fields exactly
store the original product
produce a clean normalized product name
assign a product category
copy original quantity, unit, and price
compute canonical quantity, unit, and price
record assumptions
return valid NormalizedListing JSON only
`;

function parseJsonString(jsonString: string): NormalizedListing {
    const cleaned = jsonString
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/gi, "")
        .trim();

    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        throw new Error("Normalization agent response did not contain a valid JSON object.");
    }

    const jsonOnly = cleaned.slice(firstBrace, lastBrace + 1);
    return JSON.parse(jsonOnly) as NormalizedListing;
}


export async function normalize(inputString: string) {
    const apiKey = process.env.BACKBOARD_API_KEY;
    if (!apiKey) {
        throw new Error("Missing BACK_BOARD_API_KEY in .env.local")
    }

    let normalizedListing: NormalizedListing | undefined;

    const client = new BackboardClient({ apiKey })

    const assistant = await client.createAssistant({
        name: "Farmesh Normalization Agent",
        system_prompt: NORMALIZATION_SYSTEM_PROMPT
    })

    const thread = await client.createThread(assistant.assistantId)

    const response = (await client.addMessage(thread.threadId, {
        content: inputString,
        llm_provider: NORMALIZATION_PROVIDER,
        model_name: NORMALIZATION_MODEL,
        stream: false,
    })) as MessageResponse

    try {
        if (response.content) {
            console.log("[ListingNormAgent] Response content:", response.content);
            normalizedListing = parseJsonString(response.content)
        }

    } catch (error) {
        console.warn("[ListingNormAgent] Failed to parse response:", error);
    }

    try {
        await client.deleteAssistant(assistant.assistantId);
        await client.deleteThread(thread.threadId);
    } catch {
        // Best-effort cleanup only.
    }

    return normalizedListing;
}