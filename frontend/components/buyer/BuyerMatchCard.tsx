"use client";

import { useState } from "react";
import type { Match } from "@/types";
import StatusBadge from "@/components/layout/StatusBadge";
import { Sparkles } from "lucide-react";

type MatchInsights = {
    summary: string;
    detail: string;
    metrics: Array<{ label: string; value: string }>;
    history: string[];
    recommendations: string[];
    risks: string[];
};

type BuyerMatchCardProps = {
    match: Match;
    recommended?: boolean;
    onAdvanceStatus?: (match: Match) => Promise<void>;
    onDecline?: (match: Match) => Promise<void>;
};

export default function BuyerMatchCard({
    match,
    recommended = false,
    onAdvanceStatus,
    onDecline,
}: BuyerMatchCardProps) {
    const [showDetails, setShowDetails] = useState(false);
    const [insights, setInsights] = useState<MatchInsights | null>(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [insightError, setInsightError] = useState<string | null>(null);
    const [advancing, setAdvancing] = useState(false);
    const [declining, setDeclining] = useState(false);

    const isSplit = match.product.toLowerCase().includes("split");
    const vendorName = match.vendor?.name ?? "Unknown Vendor";
    const vendorBusiness = match.vendor?.businessName ?? null;
    const vendorPhone = match.vendor?.phone ?? null;
    const vendorEmail = match.vendor?.email ?? null;
    const listingProduct = match.listing?.product ?? match.product;
    const listingQuantity = match.listing ? `${match.listing.quantity} ${match.listing.unit}` : null;
    const listingPrice = match.listing
        ? `$${match.listing.pricePerUnit.toFixed(2)} / ${match.listing.unit}`
        : null;
    const vendorContact = [vendorPhone, vendorEmail].filter(Boolean).join(" · ");
    const canConfirm = match.status === "PROPOSED" || match.status === "AWAITING_CONFIRMATION";
    const canMarkFulfilled = match.status === "CONFIRMED";
    const isFulfilled = match.status === "FULFILLED";
    const canAdvance = canConfirm || canMarkFulfilled;
    const canDecline = canConfirm;

    const primaryLabel = canMarkFulfilled
        ? "Mark Fulfilled"
        : canConfirm
            ? isSplit
                ? "Accept Split Match"
                : "Accept Match"
            : "Fulfilled";

    const loadInsights = async () => {
        if (loadingInsights || insights) return;
        setLoadingInsights(true);
        setInsightError(null);

        try {
            const response = await fetch(`/api/matches/${match.id}/insights?viewer=buyer`, {
                cache: "no-store",
            });

            if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as { error?: string } | null;
                throw new Error(payload?.error ?? "Failed to load match details.");
            }

            const payload = (await response.json()) as MatchInsights;
            setInsights(payload);
        } catch (error) {
            setInsightError(error instanceof Error ? error.message : "Failed to load details.");
        } finally {
            setLoadingInsights(false);
        }
    };

    const toggleDetails = async () => {
        if (showDetails) {
            setShowDetails(false);
            return;
        }

        setShowDetails(true);
        await loadInsights();
    };

    const handleDecline = async () => {
        if (!onDecline || declining) return;

        try {
            setDeclining(true);
            await onDecline(match);
        } finally {
            setDeclining(false);
        }
    };

    const handleAdvance = async () => {
        if (!onAdvanceStatus || !canAdvance || advancing) return;

        try {
            setAdvancing(true);
            await onAdvanceStatus(match);
        } finally {
            setAdvancing(false);
        }
    };

    return (
        <div
            className="hover-lift border p-6 transition-all duration-400"
            style={{
                borderColor: recommended ? "#fde68a" : "var(--border-soft)",
                backgroundColor: recommended ? "#fffbeb" : "var(--surface-card)",
                borderLeftWidth: recommended ? "3px" : "1px",
                borderLeftColor: recommended ? "#d97706" : "var(--border-soft)",
            }}
        >
            {/* Recommended badge */}
            {recommended && (
                <div className="mb-5 flex w-fit items-center gap-1.5 border border-amber-200 bg-white px-3 py-1">
                    <Sparkles className="h-3 w-3 text-amber-600" />
                    <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-amber-700">
                        Recommended by Farmesh AI
                    </span>
                </div>
            )}

            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-3">
                <h3 className="font-serif text-lg" style={{ color: "var(--foreground)" }}>
                    {match.product}
                </h3>
                <StatusBadge status={match.status} />
            </div>

            {/* Score bar */}
            <div className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--text-muted)" }}>
                        Match score
                    </span>
                    <span className="font-serif text-xl text-amber-700">{match.score}%</span>
                </div>
                <div style={{ height: "2px", backgroundColor: "var(--border-default)" }}>
                    <div
                        className="h-full bg-amber-600 transition-all duration-700"
                        style={{ width: `${match.score}%` }}
                    />
                </div>
            </div>

            {/* Explanation */}
            <p className="mb-5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {match.reason}
            </p>

            {(match.status === "CONFIRMED" || match.status === "FULFILLED") && (
                <div
                    className="mb-5 border-l-2 px-4 py-3"
                    style={{
                        borderLeftColor: match.status === "FULFILLED" ? "#16a34a" : "#d97706",
                        backgroundColor: "var(--surface-base)",
                    }}
                >
                    <p
                        className="text-[11px] font-semibold tracking-[0.15em] uppercase"
                        style={{ color: match.status === "FULFILLED" ? "#166534" : "#92400e" }}
                    >
                        {match.status === "FULFILLED" ? "Order fulfilled" : "Match confirmed"}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                        {match.status === "FULFILLED"
                            ? "This match is complete."
                            : "Coordinate directly with the vendor using the contact details below."}
                    </p>
                    {vendorContact && (
                        <p className="mt-1 text-sm" style={{ color: "var(--foreground)" }}>
                            Vendor contact: {vendorContact}
                        </p>
                    )}
                </div>
            )}

            {!showDetails && (
                <div className="mb-5">
                    <p className="mb-2 text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--text-muted)" }}>
                        Vendor details
                    </p>
                    <div
                        className="border px-4 py-3 text-sm"
                        style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-base)", color: "var(--text-muted)" }}
                    >
                        <p className="font-semibold" style={{ color: "var(--foreground)" }}>
                            {vendorName}
                        </p>
                        {vendorBusiness && <p>Business: {vendorBusiness}</p>}
                        {vendorPhone && <p>Phone: {vendorPhone}</p>}
                        {vendorEmail && <p>Email: {vendorEmail}</p>}
                        <p className="mt-2">
                            Product: {listingProduct}
                        </p>
                        {listingQuantity && <p>Available: {listingQuantity}</p>}
                        {listingPrice && <p>Price: {listingPrice}</p>}
                    </div>
                </div>
            )}

            {showDetails && (
                <div className="mb-5 space-y-4">
                    <div
                        className="border p-4"
                        style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-base)" }}
                    >
                        {loadingInsights && (
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                Generating coordination insights...
                            </p>
                        )}
                        {insightError && (
                            <p className="text-sm text-red-600">{insightError}</p>
                        )}
                        {!loadingInsights && !insightError && insights && (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-amber-700">
                                        Coordination Summary
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                                        {insights.summary}
                                    </p>
                                    <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-subtle)" }}>
                                        {insights.detail}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {insights.metrics.map((metric) => (
                                        <div key={metric.label} className="border px-3 py-2" style={{ borderColor: "var(--border-subtle)" }}>
                                            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase" style={{ color: "var(--text-faint)" }}>
                                                {metric.label}
                                            </p>
                                            <p className="mt-1 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                                                {metric.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <p className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--text-muted)" }}>
                                        Match history
                                    </p>
                                    <ul className="mt-2 space-y-1 text-sm" style={{ color: "var(--text-muted)" }}>
                                        {insights.history.map((entry) => (
                                            <li key={entry}>• {entry}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-amber-700">
                                            Recommended actions
                                        </p>
                                        <ul className="mt-2 space-y-1 text-sm" style={{ color: "var(--text-muted)" }}>
                                            {insights.recommendations.map((entry) => (
                                                <li key={entry}>• {entry}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-red-600">
                                            Risk checks
                                        </p>
                                        <ul className="mt-2 space-y-1 text-sm" style={{ color: "var(--text-muted)" }}>
                                            {insights.risks.map((entry) => (
                                                <li key={entry}>• {entry}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => void handleAdvance()}
                    disabled={!onAdvanceStatus || !canAdvance || advancing || isFulfilled}
                    className="bg-amber-600 px-5 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase text-white transition-colors duration-300 hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                    style={canMarkFulfilled ? { backgroundColor: "#16a34a" } : undefined}
                >
                    {advancing ? "Saving..." : primaryLabel}
                </button>
                <button
                    type="button"
                    onClick={() => void toggleDetails()}
                    className="border px-5 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase transition-colors duration-300"
                    style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}
                >
                    {showDetails ? "Back to Summary" : "View Details"}
                </button>
                {canDecline && (
                    <button
                        type="button"
                        onClick={() => void handleDecline()}
                        disabled={declining || !onDecline}
                        className="border px-5 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase transition-colors duration-300 disabled:opacity-60"
                        style={{ borderColor: "#fecaca", color: "#b91c1c" }}
                    >
                        {declining ? "Declining..." : "Decline"}
                    </button>
                )}
            </div>
        </div>
    );
}
