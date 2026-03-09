"use client";

import { useState } from "react";
import type { Match } from "@/types";
import StatusBadge from "@/components/layout/StatusBadge";

type MatchInsights = {
    summary: string;
    detail: string;
    metrics: Array<{ label: string; value: string }>;
    history: string[];
    recommendations: string[];
    risks: string[];
};

type FarmerMatchCardProps = {
    match: Match;
    onAdvanceStatus?: (match: Match) => Promise<void>;
    onDecline?: (match: Match) => Promise<void>;
};

export default function FarmerMatchCard({ match, onAdvanceStatus, onDecline }: FarmerMatchCardProps) {
    const [showDetails, setShowDetails] = useState(false);
    const [insights, setInsights] = useState<MatchInsights | null>(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [insightError, setInsightError] = useState<string | null>(null);
    const [advancing, setAdvancing] = useState(false);
    const [declining, setDeclining] = useState(false);

    const buyerName = match.buyer?.name ?? "Unknown Buyer";
    const buyerBusiness = match.buyer?.businessName ?? null;
    const buyerPhone = match.buyer?.phone ?? null;
    const buyerEmail = match.buyer?.email ?? null;
    const requestProduct = match.request?.product ?? match.product;
    const requestQuantity = match.request ? `${match.request.quantity} ${match.request.unit}` : null;
    const requestPrice = match.request
        ? `$${match.request.pricePerUnit.toFixed(2)} / ${match.request.unit}`
        : null;
    const buyerContact = [buyerPhone, buyerEmail].filter(Boolean).join(" · ");
    const canConfirm = match.status === "PROPOSED" || match.status === "AWAITING_CONFIRMATION";
    const canMarkFulfilled = match.status === "CONFIRMED";
    const isFulfilled = match.status === "FULFILLED";
    const canAdvance = canConfirm || canMarkFulfilled;
    const canDecline = canConfirm;

    const primaryLabel = canMarkFulfilled
        ? "Mark Fulfilled"
        : canConfirm
            ? "Accept"
            : "Fulfilled";

    const loadInsights = async () => {
        if (loadingInsights || insights) return;
        setLoadingInsights(true);
        setInsightError(null);

        try {
            const response = await fetch(`/api/matches/${match.id}/insights?viewer=farmer`, {
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
            className="hover-lift flex flex-col border p-6 transition-all duration-400"
            style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-card)" }}
        >
            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="font-serif truncate text-lg" style={{ color: "var(--foreground)" }}>
                        {match.product}
                    </h3>
                    <p className="mt-0.5 text-[11px] tracking-[0.1em] uppercase" style={{ color: "var(--text-subtle)" }}>
                        Matched Buyer Demand
                    </p>
                </div>
                <StatusBadge status={match.status} />
            </div>

            {/* Score bar */}
            <div className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--text-muted)" }}>
                        Match score
                    </span>
                    <span className="font-serif text-xl text-green-700">{match.score}%</span>
                </div>
                <div className="h-px w-full" style={{ backgroundColor: "var(--border-default)" }}>
                    <div
                        className="h-full bg-green-600 transition-all duration-700"
                        style={{ width: `${match.score}%`, height: "2px" }}
                    />
                </div>
            </div>

            {/* Explanation */}
            <p className="mb-5 flex-1 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {match.reason}
            </p>

            {(match.status === "CONFIRMED" || match.status === "FULFILLED") && (
                <div
                    className="mb-5 border-l-2 px-4 py-3"
                    style={{
                        borderLeftColor: match.status === "FULFILLED" ? "#16a34a" : "#15803d",
                        backgroundColor: "var(--surface-base)",
                    }}
                >
                    <p
                        className="text-[11px] font-semibold tracking-[0.15em] uppercase"
                        style={{ color: match.status === "FULFILLED" ? "#166534" : "#166534" }}
                    >
                        {match.status === "FULFILLED" ? "Order fulfilled" : "Match confirmed"}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                        {match.status === "FULFILLED"
                            ? "This match is complete."
                            : "Coordinate directly with the buyer using the contact details below."}
                    </p>
                    {buyerContact && (
                        <p className="mt-1 text-sm" style={{ color: "var(--foreground)" }}>
                            Buyer contact: {buyerContact}
                        </p>
                    )}
                </div>
            )}

            {!showDetails && (
                <>
                    {/* Buyer details */}
                    <div className="mb-5">
                        <p className="mb-2 text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: "var(--text-muted)" }}>
                            Buyer details
                        </p>
                        <div
                            className="border px-4 py-3 text-sm"
                            style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-base)", color: "var(--text-muted)" }}
                        >
                            <p className="font-semibold" style={{ color: "var(--foreground)" }}>
                                {buyerName}
                            </p>
                            {buyerBusiness && <p>Business: {buyerBusiness}</p>}
                            {buyerPhone && <p>Phone: {buyerPhone}</p>}
                            {buyerEmail && <p>Email: {buyerEmail}</p>}
                            <p className="mt-2">
                                Requested Product: {requestProduct}
                            </p>
                            {requestQuantity && <p>Needed: {requestQuantity}</p>}
                            {requestPrice && <p>Target price: {requestPrice}</p>}
                        </div>
                    </div>

                    {/* Your contribution */}
                    <div
                        className="mb-5 border-l-2 border-green-600 px-4 py-3"
                        style={{ backgroundColor: "var(--surface-base)" }}
                    >
                        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-green-700">
                            Your contribution
                        </p>
                        <p className="mt-1 text-sm" style={{ color: "var(--foreground)" }}>
                            Product Offered: {match.product}
                        </p>
                    </div>
                </>
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
                                    <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-green-700">
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
                                        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-green-700">
                                            Recommended actions
                                        </p>
                                        <ul className="mt-2 space-y-1 text-sm" style={{ color: "var(--text-muted)" }}>
                                            {insights.recommendations.map((entry) => (
                                                <li key={entry}>• {entry}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-amber-700">
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
                    className="bg-green-600 px-5 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase text-white transition-colors duration-300 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
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
