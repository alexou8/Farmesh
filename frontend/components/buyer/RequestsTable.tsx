"use client";

import { useState } from "react";
import type { Request } from "@/types";
import StatusBadge from "@/components/layout/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";

type RequestsTableProps = {
    requests: Request[];
    onDeleteRequest?: (request: Request) => Promise<void>;
};

export default function RequestsTable({ requests, onDeleteRequest }: RequestsTableProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [pendingDelete, setPendingDelete] = useState<Request | null>(null);

    const formatDate = (value?: string) => {
        if (!value) return "—";
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return value;
        return parsed.toLocaleDateString();
    };

    const requestDelete = (request: Request) => {
        if (!onDeleteRequest || deletingId) return;
        setPendingDelete(request);
    };

    const handleDelete = async () => {
        if (!onDeleteRequest || deletingId || !pendingDelete) return;
        try {
            setDeletingId(pendingDelete.id);
            await onDeleteRequest(pendingDelete);
            setPendingDelete(null);
        } finally {
            setDeletingId(null);
        }
    };

    const cancelDelete = () => {
        if (deletingId) return;
        setPendingDelete(null);
    };

    return (
        <>
            <div className="overflow-x-auto border" style={{ borderColor: "var(--border-soft)" }}>
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b" style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-muted)" }}>
                            {["Product", "Quantity", "Budget / unit", "Posted", "Status", "Actions"].map((h) => (
                                <th
                                    key={h}
                                    className="px-5 py-3 text-[11px] font-semibold tracking-[0.15em] uppercase"
                                    style={{ color: "var(--text-muted)" }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((request) => (
                            <tr
                                key={request.id}
                                className="border-b last:border-0 transition-colors duration-200"
                                style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--surface-base)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-card)")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-base)")}
                            >
                                <td className="px-5 py-4 font-medium" style={{ color: "var(--foreground)" }}>
                                    {request.product}
                                </td>
                                <td className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
                                    {request.quantity} {request.unit}
                                </td>
                                <td className="px-5 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
                                    ${request.pricePerUnit.toFixed(2)} / {request.unit}
                                </td>
                                <td className="px-5 py-4 text-sm" style={{ color: "var(--text-subtle)" }}>
                                    {formatDate(request.createdAt)}
                                </td>
                                <td className="px-5 py-4">
                                    <StatusBadge status={request.status} />
                                </td>
                                <td className="px-5 py-4">
                                    <button
                                        type="button"
                                        onClick={() => requestDelete(request)}
                                        disabled={!onDeleteRequest || Boolean(deletingId)}
                                        className="border px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase transition-colors duration-200 disabled:opacity-60"
                                        style={{ borderColor: "#fecaca", color: "#b91c1c", backgroundColor: "#fff1f2" }}
                                    >
                                        {deletingId === request.id ? "Deleting..." : "Delete"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                open={Boolean(pendingDelete)}
                title="Delete Request"
                message={
                    pendingDelete
                        ? `Delete "${pendingDelete.product}" from your open requests? This action cannot be undone.`
                        : ""
                }
                confirmLabel="Delete Request"
                cancelLabel="Cancel"
                accentColor="amber"
                busy={Boolean(deletingId)}
                busyLabel="Deleting..."
                onCancel={cancelDelete}
                onConfirm={() => void handleDelete()}
            />
        </>
    );
}
