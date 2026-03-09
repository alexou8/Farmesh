type StatusBadgeProps = {
    status: string;
};

type StyleMap = Record<string, { border: string; bg: string; color: string }>;

const styleMap: StyleMap = {
    OPEN:                   { border: "#bbf7d0", bg: "#f0fdf4", color: "#166534" },
    MATCHED:                { border: "#bfdbfe", bg: "#eff6ff", color: "#1d4ed8" },
    CONFIRMED:              { border: "#a7f3d0", bg: "#ecfdf5", color: "#065f46" },
    FULFILLED:              { border: "#86efac", bg: "#dcfce7", color: "#166534" },
    EXPIRED:                { border: "var(--border-default)", bg: "var(--surface-muted)", color: "var(--text-muted)" },
    PROPOSED:               { border: "#fde68a", bg: "#fffbeb", color: "#92400e" },
    AWAITING_CONFIRMATION:  { border: "#fde68a", bg: "#fffbeb", color: "#92400e" },
    REJECTED:               { border: "#fecaca", bg: "#fef2f2", color: "#dc2626" },
    Pending:                { border: "#fde68a", bg: "#fffbeb", color: "#92400e" },
    "In Transit":           { border: "#bfdbfe", bg: "#eff6ff", color: "#1d4ed8" },
    Delivered:              { border: "#bbf7d0", bg: "#f0fdf4", color: "#166534" },
    Cancelled:              { border: "#fecaca", bg: "#fef2f2", color: "#dc2626" },
};

const fallback = { border: "var(--border-default)", bg: "var(--surface-muted)", color: "var(--text-muted)" };

export default function StatusBadge({ status }: StatusBadgeProps) {
    const s = styleMap[status] ?? fallback;
    const label = status.replace(/_/g, " ");

    return (
        <span
            className="inline-block border px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase"
            style={{ borderColor: s.border, backgroundColor: s.bg, color: s.color }}
        >
            {label}
        </span>
    );
}
