"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Plus, ShoppingCart, Sparkles, RefreshCw } from "lucide-react";
import AppNav from "@/components/layout/AppNav";
import TabGroup from "@/components/layout/TabGroup";
import PostRequestForm from "@/components/buyer/PostRequestForm";
import RequestsTable from "@/components/buyer/RequestsTable";
import BuyerMatchCard from "@/components/buyer/BuyerMatchCard";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import { getUser } from "@/lib/auth";
import type { Match, Request } from "@/types";

type CoordinationEvent = {
  matchId: string;
  summary: string;
  createdAt: string;
};

const tabs = [
  { label: "Requests", value: "requests" },
  { label: "Matches", value: "matches" },
];

function getNextMatchStatus(status: Match["status"]): Match["status"] | null {
  if (status === "PROPOSED" || status === "AWAITING_CONFIRMATION") {
    return "CONFIRMED";
  }
  if (status === "CONFIRMED") {
    return "FULFILLED";
  }
  return null;
}

function buildBuyerMatchStatusMessage(match: Match, nextStatus: Match["status"]) {
  if (nextStatus === "CONFIRMED") {
    const vendorName = match.vendor?.businessName ?? match.vendor?.name ?? "the vendor";
    const contactParts = [match.vendor?.phone, match.vendor?.email].filter(Boolean).join(" / ");
    const contactSuffix = contactParts ? ` Contact ${vendorName} at ${contactParts}.` : "";
    return `Match for ${match.product} is now CONFIRMED.${contactSuffix}`;
  }

  if (nextStatus === "FULFILLED") {
    return `Match for ${match.product} is now FULFILLED.`;
  }

  return `Match for ${match.product} updated to ${nextStatus}.`;
}

export default function BuyerDashboard() {
  const [activeTab, setActiveTab] = useState("requests");
  const [showPostForm, setShowPostForm] = useState(false);
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningMatch, setRunningMatch] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [coordinationEvents, setCoordinationEvents] = useState<CoordinationEvent[]>([]);

  const fetchDashboardData = useCallback(async (currentBuyerId: string) => {
    const [requestsResponse, matchesResponse] = await Promise.all([
      fetch(`/api/requests?buyerId=${currentBuyerId}`),
      fetch(`/api/matches?buyerId=${currentBuyerId}`),
    ]);

    if (!requestsResponse.ok || !matchesResponse.ok) {
      throw new Error("Failed to load dashboard data.");
    }

    const [requestData, matchData] = (await Promise.all([
      requestsResponse.json(),
      matchesResponse.json(),
    ])) as [Request[], Match[]];

    setRequests(requestData);
    setMatches(matchData.filter((match) => match.status !== "REJECTED"));
  }, []);

  const refreshData = useCallback(async () => {
    if (!buyerId) return;
    await fetchDashboardData(buyerId);
  }, [buyerId, fetchDashboardData]);

  const notifyDashboardAction = useCallback((message: string) => {
    window.dispatchEvent(
      new CustomEvent("farmesh:notification", {
        detail: { message },
      })
    );
    window.dispatchEvent(new Event("farmesh:data-updated"));
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const user = await getUser();
        if (!user || user.type !== "buyer") {
          if (mounted) {
            setStatusMessage("Buyer account required.");
            setLoading(false);
          }
          return;
        }

        if (!mounted) return;
        setBuyerId(user.id);
        await fetchDashboardData(user.id);
      } catch (error) {
        if (mounted) {
          setStatusMessage(
            error instanceof Error ? error.message : "Failed to load dashboard"
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [fetchDashboardData]);

  useEffect(() => {
    const handleDashboardNotification = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      const message = customEvent.detail?.message?.trim();
      if (!message) return;
      setStatusMessage(message);
      void refreshData();
    };

    window.addEventListener(
      "farmesh:dashboard-notification",
      handleDashboardNotification as EventListener
    );

    return () => {
      window.removeEventListener(
        "farmesh:dashboard-notification",
        handleDashboardNotification as EventListener
      );
    };
  }, [refreshData]);

  const runMatching = async () => {
    setRunningMatch(true);
    setStatusMessage(null);
    setCoordinationEvents([]);

    try {
      const response = await fetch("/api/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to run matching");
      }

      const result = (await response.json()) as {
        matchesFound: number;
        message?: string;
        coordinationEvents?: CoordinationEvent[];
      };
      await refreshData();
      window.dispatchEvent(new Event("farmesh:data-updated"));
      setCoordinationEvents(result.coordinationEvents ?? []);
      setStatusMessage(result.message ?? `Matching completed. ${result.matchesFound} match(es) found.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Failed to run matching");
    } finally {
      setRunningMatch(false);
    }
  };

  const openCount = requests.filter((request) => request.status === "OPEN").length;
  const proposedCount = matches.filter(
    (match) => match.status === "PROPOSED" || match.status === "AWAITING_CONFIRMATION"
  ).length;

  const handleDeleteRequest = useCallback(
    async (request: Request) => {
      setStatusMessage(null);

      try {
        const response = await fetch(`/api/requests/${request.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Failed to delete request.");
        }

        const payload = (await response.json()) as { removedMatches?: number };
        setRequests((previous) => previous.filter((item) => item.id !== request.id));
        setMatches((previous) => previous.filter((item) => item.requestId !== request.id));

        const removedMatches = payload.removedMatches ?? 0;
        const message =
          removedMatches > 0
            ? `Deleted request ${request.product}. ${removedMatches} related match(es) were removed.`
            : `Deleted request ${request.product}.`;

        setStatusMessage(message);
        notifyDashboardAction(message);
        await refreshData();
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : "Failed to delete request.");
      }
    },
    [notifyDashboardAction, refreshData]
  );

  const handleDeclineMatch = useCallback(
    async (match: Match) => {
      setStatusMessage(null);

      try {
        const response = await fetch(`/api/matches/${match.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "REJECTED" }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Failed to decline match.");
        }

        setMatches((previous) => previous.filter((item) => item.id !== match.id));
        const message = `Declined match for ${match.product}.`;
        setStatusMessage(message);
        notifyDashboardAction(message);
        await refreshData();
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : "Failed to decline match.");
      }
    },
    [notifyDashboardAction, refreshData]
  );

  const handleAdvanceMatchStatus = useCallback(
    async (match: Match) => {
      const nextStatus = getNextMatchStatus(match.status);
      if (!nextStatus) return;

      setStatusMessage(null);

      try {
        const response = await fetch(`/api/matches/${match.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error ?? "Failed to update match.");
        }

        const payload = (await response.json()) as {
          status?: Match["status"];
          downgraded?: boolean;
          requestedStatus?: Match["status"];
        };
        const appliedStatus = payload.status ?? nextStatus;

        setMatches((previous) =>
          previous.map((item) => (item.id === match.id ? { ...item, status: appliedStatus } : item))
        );

        const message = buildBuyerMatchStatusMessage(match, appliedStatus);
        setStatusMessage(message);
        notifyDashboardAction(message);
        await refreshData();
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : "Failed to update match.");
      }
    },
    [notifyDashboardAction, refreshData]
  );

  const statCard = (icon: React.ReactNode, label: string, value: number, sub: string) => (
    <div
      className="hover-lift border p-6"
      style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-card)" }}
    >
      <div
        className="mb-4 flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase"
        style={{ color: "var(--text-muted)" }}
      >
        {icon}
        {label}
      </div>
      <p className="font-serif text-4xl" style={{ color: "var(--foreground)" }}>
        {value}
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--text-subtle)" }}>
        {sub}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      <AppNav unreadCount={0} />

      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-12">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between animate-fade-in">
          <div>
            <p className="mb-1 text-[11px] font-semibold tracking-[0.3em] uppercase text-amber-600">
              Procurement Hub
            </p>
            <h1 className="font-serif text-3xl md:text-4xl" style={{ color: "var(--foreground)" }}>
              Buyer Dashboard
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Post sourcing needs, review AI matches, and run matching on demand.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runMatching}
              disabled={runningMatch || loading}
              className="flex w-fit items-center gap-2 border px-6 py-3 text-xs font-semibold tracking-[0.12em] uppercase transition-all duration-300 disabled:opacity-60"
              style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${runningMatch ? "animate-spin" : ""}`} />
              Run Matching
            </button>
            <button
              type="button"
              onClick={() => setShowPostForm((value) => !value)}
              className="flex w-fit items-center gap-2 bg-amber-600 px-6 py-3 text-xs font-semibold tracking-[0.12em] uppercase text-white transition-all duration-300 hover:bg-amber-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Post Request
            </button>
          </div>
        </div>

        {statusMessage && (
          <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
            {statusMessage}
          </p>
        )}

        {coordinationEvents.length > 0 && (
          <div
            className="mb-6 border p-4"
            style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-base)" }}
          >
            <p className="mb-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-amber-700">
              Coordination Updates
            </p>
            <div className="space-y-2">
              {coordinationEvents.map((event) => (
                <p key={event.matchId} className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {event.summary}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="mb-10 grid grid-cols-2 gap-4 stagger-children">
          {statCard(<ShoppingCart className="h-3.5 w-3.5" />, "Requests", openCount, "open requests")}
          {statCard(<Sparkles className="h-3.5 w-3.5" />, "Matches", proposedCount, "pending review")}
        </div>

        {showPostForm && (
          <div className="mb-10 animate-fade-in-up">
            <PostRequestForm
              buyerId={buyerId ?? undefined}
              onClose={() => setShowPostForm(false)}
              onSubmitted={refreshData}
            />
          </div>
        )}

        <TabGroup
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          accentColor="amber"
        />

        <div className="mt-6">
          {loading && <p style={{ color: "var(--text-muted)" }}>Loading...</p>}

          {!loading && activeTab === "requests" && (
            <RequestsTable
              requests={requests}
              onDeleteRequest={handleDeleteRequest}
            />
          )}

          {!loading && activeTab === "matches" && (
            <div className="grid gap-4 stagger-children">
              {matches.length === 0 && (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No matches yet.
                </p>
              )}
              {matches.map((match, index) => (
                <BuyerMatchCard
                  key={match.id}
                  match={match}
                  recommended={index === 0}
                  onAdvanceStatus={handleAdvanceMatchStatus}
                  onDecline={handleDeclineMatch}
                />
              ))}
            </div>
          )}

        </div>
      </div>
      <LoadingOverlay
        open={runningMatch}
        title="Running Matching"
        message="Normalizing open data and generating best matches."
        accentColor="amber"
      />
    </div>
  );
}
