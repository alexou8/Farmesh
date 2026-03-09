import type { Order } from "@/types";
import StatusBadge from "@/components/layout/StatusBadge";
import { Truck } from "lucide-react";

type OrderCardProps = {
    order: Order;
};

export default function OrderCard({ order }: OrderCardProps) {
    return (
        <div
            className="hover-lift border p-6"
            style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-card)" }}
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <h3 className="font-serif text-lg" style={{ color: "var(--foreground)" }}>
                    {order.title}
                </h3>
                <StatusBadge status={order.status} />
            </div>

            <div className="mb-4 space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
                <p>
                    <span className="text-[11px] font-semibold tracking-[0.12em] uppercase" style={{ color: "var(--text-muted)" }}>
                        Vendors:{" "}
                    </span>
                    {order.vendors.join(", ")}
                </p>
                <p>
                    <span className="text-[11px] font-semibold tracking-[0.12em] uppercase" style={{ color: "var(--text-muted)" }}>
                        Quantity:{" "}
                    </span>
                    {order.quantity}
                </p>
            </div>

            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-subtle)" }}>
                <Truck className="h-3.5 w-3.5" />
                <span className="tracking-[0.05em]">Delivery target: {order.deliveryTarget}</span>
            </div>
        </div>
    );
}
