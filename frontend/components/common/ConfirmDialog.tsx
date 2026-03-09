"use client";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  accentColor?: "green" | "amber";
  busy?: boolean;
  busyLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  accentColor = "green",
  busy = false,
  busyLabel = "Saving...",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const accentHex = accentColor === "green" ? "#16a34a" : "#d97706";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4">
      <div
        className="w-full max-w-xl border p-6 shadow-xl"
        style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-card)" }}
      >
        <h3 className="font-serif text-2xl" style={{ color: "var(--foreground)" }}>
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {message}
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="border px-5 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase transition-colors duration-300 disabled:opacity-60"
            style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="px-5 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase text-white transition-colors duration-300 disabled:opacity-60"
            style={{ backgroundColor: accentHex }}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
