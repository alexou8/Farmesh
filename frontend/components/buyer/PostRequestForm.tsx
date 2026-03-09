import { useState } from "react";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import DatePicker from "@/components/ui/date-picker";

type PostRequestFormProps = {
  buyerId?: string;
  onClose: () => void;
  onSubmitted?: () => void | Promise<void>;
};

const inputCls =
  "w-full border px-3 py-2 text-sm font-sans outline-none transition-colors duration-200";
const inputStyle = {
  borderColor: "var(--border-default)",
  backgroundColor: "var(--surface-base)",
  color: "var(--foreground)",
} as const;

export default function PostRequestForm({ buyerId, onClose, onSubmitted }: PostRequestFormProps) {
  const [rawInput, setRawInput] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("lb");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [neededDate, setNeededDate] = useState("");
  const [allowSubstitutions, setAllowSubstitutions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    const numericQuantity = Number(quantity);
    const numericPrice = Number(pricePerUnit);

    if (!product.trim()) {
      setError("Product is required.");
      return;
    }
    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError("Price per unit must be non-negative.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          buyerId,
          rawInput,
          product,
          quantity: numericQuantity,
          unit,
          pricePerUnit: numericPrice,
          neededDate,
          allowSubstitutions,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to create request.");
      }

      window.dispatchEvent(new Event("farmesh:data-updated"));
      await onSubmitted?.();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="border p-6"
        style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-base)" }}
      >
        <p className="mb-1 text-[11px] font-semibold tracking-[0.25em] uppercase text-amber-700">
          New Request
        </p>
        <h3 className="font-serif mb-4 text-xl" style={{ color: "var(--foreground)" }}>
          Post New Request
        </h3>

        <textarea
          rows={3}
          value={rawInput}
          onChange={(event) => setRawInput(event.target.value)}
          placeholder="Need 100 lbs of high-quality salad greens, organic preferred, by Friday"
          className="w-full resize-none border px-4 py-3 text-sm font-sans outline-none transition-colors duration-200"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "var(--surface-card)",
            color: "var(--foreground)",
          }}
          onFocus={(event) => (event.currentTarget.style.borderColor = "#d97706")}
          onBlur={(event) => (event.currentTarget.style.borderColor = "var(--border-default)")}
        />

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label
              className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              Product
            </label>
            <input
              type="text"
              value={product}
              onChange={(event) => setProduct(event.target.value)}
              placeholder="e.g. Salad Greens"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          <div>
            <label
              className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              Quantity needed
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="100"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          <div>
            <label
              className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              Unit
            </label>
            <input
              type="text"
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              placeholder="lb"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          <div>
            <label
              className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              Price per unit
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={pricePerUnit}
              onChange={(event) => setPricePerUnit(event.target.value)}
              placeholder="5.00"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          <div>
            <label
              className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              Required by
            </label>
            <DatePicker
              value={neededDate}
              onChange={setNeededDate}
              accent="amber"
              disabled={loading}
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
              <input
                type="checkbox"
                checked={allowSubstitutions}
                onChange={(event) => setAllowSubstitutions(event.target.checked)}
                className="accent-amber-600"
              />
              Allow substitutions
            </label>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-amber-600 px-6 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase text-white transition-colors duration-300 hover:bg-amber-700 disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border px-6 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase transition-colors duration-300"
            style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}
          >
            Cancel
          </button>
        </div>
      </div>
      <LoadingOverlay
        open={loading}
        title="Creating Request"
        message="Normalizing your request and checking for matches."
        accentColor="amber"
      />
    </>
  );
}
