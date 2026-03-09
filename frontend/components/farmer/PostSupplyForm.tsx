import { useState } from "react";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import DatePicker from "@/components/ui/date-picker";

type PostSupplyFormProps = {
  vendorId?: string;
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

export default function PostSupplyForm({ vendorId, onClose, onSubmitted }: PostSupplyFormProps) {
  const [rawInput, setRawInput] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("lb");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
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
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendorId,
          rawInput,
          product,
          quantity: numericQuantity,
          unit,
          pricePerUnit: numericPrice,
          expirationDate,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to create listing.");
      }

      window.dispatchEvent(new Event("farmesh:data-updated"));
      await onSubmitted?.();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create listing.");
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
        <p className="mb-1 text-[11px] font-semibold tracking-[0.25em] uppercase text-green-700">
          New Listing
        </p>
        <h3 className="font-serif mb-4 text-xl" style={{ color: "var(--foreground)" }}>
          Post New Supply
        </h3>

        <textarea
          rows={3}
          value={rawInput}
          onChange={(event) => setRawInput(event.target.value)}
          placeholder="I have 60 lbs of baby greens available this week for bulk sale"
          className="w-full resize-none border px-4 py-3 text-sm font-sans outline-none transition-colors duration-200"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "var(--surface-card)",
            color: "var(--foreground)",
          }}
          onFocus={(event) => (event.currentTarget.style.borderColor = "#16a34a")}
          onBlur={(event) => (event.currentTarget.style.borderColor = "var(--border-default)")}
        />

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
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
              placeholder="e.g. Baby Greens"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          <div>
            <label
              className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              Quantity
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="60"
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
              Price / unit
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={pricePerUnit}
              onChange={(event) => setPricePerUnit(event.target.value)}
              placeholder="4.50"
              className={inputCls}
              style={inputStyle}
            />
          </div>

          <div>
            <label
              className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              Expiry Date
            </label>
            <DatePicker
              value={expirationDate}
              onChange={setExpirationDate}
              accent="green"
              disabled={loading}
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 px-6 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase text-white transition-colors duration-300 hover:bg-green-700 disabled:opacity-60"
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
        title="Creating Listing"
        message="Normalizing your listing and checking for matches."
        accentColor="green"
      />
    </>
  );
}
