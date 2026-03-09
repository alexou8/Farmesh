"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sprout, Bell, LogOut, UserRound } from "lucide-react";
import { getUser } from "@/lib/auth";
import { signout } from "@/app/actions/signout";
import type { Listing, Match, Request, User } from "@/types";

type AppNavProps = {
  unreadCount?: number;
};

type RuntimeNotification = {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
};

type RuntimeNotificationEventDetail = {
  id?: string;
  message: string;
  createdAt?: string;
};

type EntitySnapshot = Record<
  string,
  {
    status: string;
    product: string;
    quantity: number;
    unit: string;
  }
>;

type NotificationSnapshot = {
  listings: EntitySnapshot;
  requests: EntitySnapshot;
  matches: MatchSnapshot;
};

type MatchSnapshot = Record<
  string,
  {
    status: string;
    product: string;
    counterpartyName: string | null;
    counterpartyPhone: string | null;
    counterpartyEmail: string | null;
  }
>;

const NOTIFICATION_POLL_MS = 60_000;
const CHECK_THROTTLE_MS = 8_000;
const FORCE_CHECK_THROTTLE_MS = 1_000;

function getNotificationKey(userId: string) {
  return `farmesh:notifications:${userId}`;
}

function getSnapshotKey(userId: string) {
  return `farmesh:notification-snapshot:${userId}`;
}

function parseNotifications(raw: string | null): RuntimeNotification[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as RuntimeNotification[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        typeof item.id === "string" &&
        typeof item.message === "string" &&
        typeof item.createdAt === "string" &&
        typeof item.read === "boolean"
    );
  } catch {
    return [];
  }
}

function parseSnapshot(raw: string | null): NotificationSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as NotificationSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      listings:
        parsed.listings && typeof parsed.listings === "object" ? parsed.listings : {},
      requests:
        parsed.requests && typeof parsed.requests === "object" ? parsed.requests : {},
      matches:
        parsed.matches && typeof parsed.matches === "object" ? parsed.matches : {},
    };
  } catch {
    return null;
  }
}

function formatTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function buildMatchSnapshot(matches: Match[], userType: User["type"]): MatchSnapshot {
  return matches.reduce<MatchSnapshot>((acc, match) => {
    const isFarmer = userType === "farmer";
    const counterparty = isFarmer ? match.buyer : match.vendor;
    acc[match.id] = {
      status: match.status,
      product: match.product,
      counterpartyName: counterparty?.businessName ?? counterparty?.name ?? null,
      counterpartyPhone: counterparty?.phone ?? null,
      counterpartyEmail: counterparty?.email ?? null,
    };
    return acc;
  }, {});
}

function buildMatchNotificationMessage(
  match: MatchSnapshot[string],
  nextStatus: string,
  options?: { isNew?: boolean }
) {
  if (options?.isNew) {
    return `New match proposed for ${match.product}.`;
  }

  if (nextStatus === "CONFIRMED") {
    const contact = [match.counterpartyPhone, match.counterpartyEmail]
      .filter(Boolean)
      .join(" / ");
    if (!contact) {
      return `Match for ${match.product} moved to CONFIRMED. Please contact your counterparty.`;
    }

    const counterpartyLabel = match.counterpartyName ?? "your counterparty";
    return `Match for ${match.product} moved to CONFIRMED. Contact ${counterpartyLabel} at ${contact}.`;
  }

  if (nextStatus === "FULFILLED") {
    return `Match for ${match.product} moved to FULFILLED.`;
  }

  return `Match for ${match.product} moved to ${nextStatus}.`;
}

export default function AppNav({ unreadCount = 0 }: AppNavProps) {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<RuntimeNotification[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const pathname = usePathname();
  const snapshotRef = useRef<NotificationSnapshot | null>(null);
  const notificationsRef = useRef<RuntimeNotification[]>([]);
  const inFlightCheckRef = useRef<Promise<void> | null>(null);
  const lastCheckAtRef = useRef(0);

  const persistNotifications = useCallback((userId: string, items: RuntimeNotification[]) => {
    localStorage.setItem(getNotificationKey(userId), JSON.stringify(items.slice(0, 40)));
  }, []);

  const persistSnapshot = useCallback((userId: string, snapshot: NotificationSnapshot) => {
    localStorage.setItem(getSnapshotKey(userId), JSON.stringify(snapshot));
  }, []);

  const pushRuntimeNotification = useCallback(
    (currentUser: User, detail: RuntimeNotificationEventDetail) => {
      const message = detail.message?.trim();
      if (!message) return;

      const createdAt = detail.createdAt ?? new Date().toISOString();
      const id =
        detail.id ??
        `runtime:${currentUser.id}:${message.slice(0, 24)}:${createdAt}`;

      setNotifications((previous) => {
        if (previous.some((item) => item.id === id)) return previous;
        const next = [
          {
            id,
            message,
            createdAt,
            read: false,
          },
          ...previous,
        ].slice(0, 40);

        persistNotifications(currentUser.id, next);
        return next;
      });
    },
    [persistNotifications]
  );

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const fetchCurrentSnapshot = useCallback(async (currentUser: User): Promise<NotificationSnapshot> => {
    if (currentUser.type === "farmer") {
      const [listingResponse, matchesResponse] = await Promise.all([
        fetch(`/api/listings?vendorId=${currentUser.id}`, { cache: "no-store" }),
        fetch(`/api/matches?vendorId=${currentUser.id}`, { cache: "no-store" }),
      ]);

      if (!listingResponse.ok) throw new Error("Failed to fetch listings for notifications");
      if (!matchesResponse.ok) throw new Error("Failed to fetch matches for notifications");

      const [listings, matches] = (await Promise.all([
        listingResponse.json(),
        matchesResponse.json(),
      ])) as [Listing[], Match[]];

      const listingSnapshot = listings.reduce<EntitySnapshot>((acc, listing) => {
        acc[listing.id] = {
          status: listing.status,
          product: listing.product,
          quantity: listing.quantity,
          unit: listing.unit,
        };
        return acc;
      }, {});

      return {
        listings: listingSnapshot,
        requests: {},
        matches: buildMatchSnapshot(matches, currentUser.type),
      };
    }

    const [requestResponse, matchesResponse] = await Promise.all([
      fetch(`/api/requests?buyerId=${currentUser.id}`, { cache: "no-store" }),
      fetch(`/api/matches?buyerId=${currentUser.id}`, { cache: "no-store" }),
    ]);

    if (!requestResponse.ok) throw new Error("Failed to fetch requests for notifications");
    if (!matchesResponse.ok) throw new Error("Failed to fetch matches for notifications");

    const [requests, matches] = (await Promise.all([
      requestResponse.json(),
      matchesResponse.json(),
    ])) as [Request[], Match[]];

    const requestSnapshot = requests.reduce<EntitySnapshot>((acc, request) => {
      acc[request.id] = {
        status: request.status,
        product: request.product,
        quantity: request.quantity,
        unit: request.unit,
      };
      return acc;
    }, {});

    return {
      listings: {},
      requests: requestSnapshot,
      matches: buildMatchSnapshot(matches, currentUser.type),
    };
  }, []);

  const checkForNotificationUpdates = useCallback(
    async (currentUser: User) => {
      const currentSnapshot = await fetchCurrentSnapshot(currentUser);
      const previousSnapshot = snapshotRef.current;

      if (!previousSnapshot) {
        snapshotRef.current = currentSnapshot;
        persistSnapshot(currentUser.id, currentSnapshot);
        return;
      }

      const next: RuntimeNotification[] = [];
      const nowIso = new Date().toISOString();

      if (currentUser.type === "farmer") {
        const previousListings = previousSnapshot.listings;
        for (const [id, listing] of Object.entries(currentSnapshot.listings)) {
          const previous = previousListings[id];
          if (!previous) {
            next.push({
              id: `listing:new:${id}`,
              message: `New listing posted: ${listing.product} (${listing.quantity} ${listing.unit}).`,
              createdAt: nowIso,
              read: false,
            });
            continue;
          }

          if (previous.status !== listing.status) {
            next.push({
              id: `listing:status:${id}:${previous.status}:${listing.status}`,
              message: `${listing.product} listing status changed from ${previous.status} to ${listing.status}.`,
              createdAt: nowIso,
              read: false,
            });
          }
        }
      } else {
        const previousRequests = previousSnapshot.requests;
        for (const [id, request] of Object.entries(currentSnapshot.requests)) {
          const previous = previousRequests[id];
          if (!previous) {
            next.push({
              id: `request:new:${id}`,
              message: `New request posted: ${request.product} (${request.quantity} ${request.unit}).`,
              createdAt: nowIso,
              read: false,
            });
            continue;
          }

          if (previous.status !== request.status) {
            next.push({
              id: `request:status:${id}:${previous.status}:${request.status}`,
              message: `${request.product} request status changed from ${previous.status} to ${request.status}.`,
              createdAt: nowIso,
              read: false,
            });
          }
        }
      }

      const previousMatches = previousSnapshot.matches;
      for (const [id, match] of Object.entries(currentSnapshot.matches)) {
        const previous = previousMatches[id];
        if (!previous) {
          next.push({
            id: `match:new:${id}:${match.status}`,
            message: buildMatchNotificationMessage(match, match.status, { isNew: true }),
            createdAt: nowIso,
            read: false,
          });
          continue;
        }

        if (previous.status !== match.status) {
          next.push({
            id: `match:status:${id}:${previous.status}:${match.status}`,
            message: buildMatchNotificationMessage(match, match.status),
            createdAt: nowIso,
            read: false,
          });
        }
      }

      if (next.length > 0) {
        const existingIds = new Set(notificationsRef.current.map((item) => item.id));
        const uniqueNew = next.filter((item) => !existingIds.has(item.id));

        if (uniqueNew.length > 0) {
          setNotifications((previousItems) => {
            const merged = [...uniqueNew, ...previousItems].slice(0, 40);
            persistNotifications(currentUser.id, merged);
            return merged;
          });

          for (const notification of uniqueNew) {
            window.dispatchEvent(
              new CustomEvent("farmesh:dashboard-notification", {
                detail: {
                  id: notification.id,
                  message: notification.message,
                  createdAt: notification.createdAt,
                },
              })
            );
          }
        }
      }

      snapshotRef.current = currentSnapshot;
      persistSnapshot(currentUser.id, currentSnapshot);
    },
    [fetchCurrentSnapshot, persistNotifications, persistSnapshot]
  );

  const markAllNotificationsRead = useCallback(
    (currentUser: User) => {
      setNotifications((previous) => {
        if (!previous.some((item) => !item.read)) return previous;
        const next = previous.map((item) => ({ ...item, read: true }));
        persistNotifications(currentUser.id, next);
        return next;
      });
    },
    [persistNotifications]
  );

  const runNotificationCheck = useCallback(
    (currentUser: User, options?: { force?: boolean }) => {
      const force = options?.force ?? false;
      const now = Date.now();
      const throttleWindow = force ? FORCE_CHECK_THROTTLE_MS : CHECK_THROTTLE_MS;

      if (now - lastCheckAtRef.current < throttleWindow) {
        return inFlightCheckRef.current ?? Promise.resolve();
      }

      if (inFlightCheckRef.current) {
        return inFlightCheckRef.current;
      }

      const task = (async () => {
        try {
          await checkForNotificationUpdates(currentUser);
        } finally {
          lastCheckAtRef.current = Date.now();
          inFlightCheckRef.current = null;
        }
      })();

      inFlightCheckRef.current = task;
      return task;
    },
    [checkForNotificationUpdates]
  );

  useEffect(() => {
    let active = true;

    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<User>;
      if (customEvent.detail) {
        setUser(customEvent.detail);
      }
    };

    getUser()
      .then((resolvedUser) => {
        if (active) {
          setUser(resolvedUser);
          if (resolvedUser) {
            const storedNotifications = parseNotifications(
              localStorage.getItem(getNotificationKey(resolvedUser.id))
            );
            const storedSnapshot = parseSnapshot(
              localStorage.getItem(getSnapshotKey(resolvedUser.id))
            );
            setNotifications(storedNotifications);
            snapshotRef.current = storedSnapshot;
          }
        }
      })
      .catch((error) => {
        // Avoid crashing UI for transient auth lock contention errors.
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("Failed to load user for navigation", error);
      });

    window.addEventListener("farmesh:profile-updated", handleProfileUpdated as EventListener);

    return () => {
      active = false;
      window.removeEventListener(
        "farmesh:profile-updated",
        handleProfileUpdated as EventListener
      );
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const isOnRoleDashboard =
      (user.type === "buyer" && pathname === "/buyer") ||
      (user.type === "farmer" && pathname === "/farmer");

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void runNotificationCheck(user);
    }, NOTIFICATION_POLL_MS);

    if (!isOnRoleDashboard && document.visibilityState === "visible") {
      void runNotificationCheck(user);
    }

    const refreshNotifications = () => {
      void runNotificationCheck(user, { force: true });
    };

    const handleRuntimeNotification = (event: Event) => {
      const customEvent = event as CustomEvent<RuntimeNotificationEventDetail>;
      if (!customEvent.detail || typeof customEvent.detail.message !== "string") return;
      pushRuntimeNotification(user, customEvent.detail);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      void runNotificationCheck(user);
    };

    window.addEventListener("farmesh:data-updated", refreshNotifications);
    window.addEventListener(
      "farmesh:notification",
      handleRuntimeNotification as EventListener
    );
    window.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("farmesh:data-updated", refreshNotifications);
      window.removeEventListener(
        "farmesh:notification",
        handleRuntimeNotification as EventListener
      );
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname, pushRuntimeNotification, runNotificationCheck, user]);

  const handleSignOut = async () => {
    await signout();
  };

  const isFarmer = user?.type === "farmer";
  const profileHref = isFarmer ? "/farmer/profile" : "/buyer/profile";
  const onProfilePage = pathname.endsWith("/profile");
  const unreadFromRuntime = notifications.filter((item) => !item.read).length;
  const totalUnread = Math.max(unreadFromRuntime, unreadCount);

  return (
    <header
      className="sticky top-0 z-50 border-b transition-all duration-500"
      style={{
        borderColor: "var(--border-soft)",
        backgroundColor: "hsl(40 33% 97% / 0.96)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center bg-green-600">
            <Sprout className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-serif text-xl tracking-tight" style={{ color: "var(--foreground)" }}>
            Farmesh
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden items-center gap-3 sm:flex">
              <span className="max-w-[180px] truncate text-xs" style={{ color: "var(--text-muted)" }}>
                {user.businessName || user.email}
              </span>
              <span
                className="border px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.15em] uppercase"
                style={{
                  borderColor: isFarmer ? "#bbf7d0" : "#fde68a",
                  backgroundColor: isFarmer ? "#f0fdf4" : "#fffbeb",
                  color: isFarmer ? "#166534" : "#92400e",
                }}
              >
                {user.type}
              </span>
            </div>
          )}

          {user && (
            <Link
              href={profileHref}
              className="border p-2 transition-colors duration-300"
              style={{
                color: onProfilePage ? "var(--foreground)" : "var(--text-subtle)",
                borderColor: onProfilePage ? "var(--border-default)" : "transparent",
                backgroundColor: onProfilePage ? "var(--surface-base)" : "transparent",
              }}
              aria-label="Profile settings"
            >
              <UserRound className="h-4 w-4" />
            </Link>
          )}

          <div className="relative">
            <button
              type="button"
              className="relative p-2 transition-colors duration-300"
              style={{ color: panelOpen ? "var(--foreground)" : "var(--text-subtle)" }}
              aria-label="Notifications"
              onClick={() =>
                setPanelOpen((value) => {
                  const next = !value;
                  if (next && user) {
                    markAllNotificationsRead(user);
                  }
                  return next;
                })
              }
              onMouseEnter={(event) => (event.currentTarget.style.color = "var(--foreground)")}
              onMouseLeave={(event) =>
                (event.currentTarget.style.color = panelOpen
                  ? "var(--foreground)"
                  : "var(--text-subtle)")
              }
            >
              <Bell className="h-4 w-4" />
              {totalUnread > 0 && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
              )}
            </button>

            {panelOpen && (
              <div
                className="absolute right-0 top-11 w-80 border p-3 shadow-xl"
                style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-card)" }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-semibold tracking-[0.14em] uppercase" style={{ color: "var(--text-muted)" }}>
                    Notifications
                  </p>
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    className="text-[11px] font-semibold tracking-[0.12em] uppercase"
                    style={{ color: "var(--text-subtle)" }}
                  >
                    Close
                  </button>
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {notifications.length === 0 && (
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      No notifications yet.
                    </p>
                  )}

                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className="border p-2"
                      style={{
                        borderColor: "var(--border-soft)",
                        backgroundColor: item.read ? "var(--surface-base)" : "hsl(45 75% 96%)",
                      }}
                    >
                      <p className="text-sm" style={{ color: "var(--foreground)" }}>
                        {item.message}
                      </p>
                      <p className="mt-1 text-[11px]" style={{ color: "var(--text-subtle)" }}>
                        {formatTime(item.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="p-2 transition-colors duration-300"
            style={{ color: "var(--text-subtle)" }}
            aria-label="Sign out"
            onMouseEnter={(event) => (event.currentTarget.style.color = "var(--foreground)")}
            onMouseLeave={(event) => (event.currentTarget.style.color = "var(--text-subtle)")}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
