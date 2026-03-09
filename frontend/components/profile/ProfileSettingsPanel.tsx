"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@/types";
import ConfirmDialog from "@/components/common/ConfirmDialog";

type ProfileSettingsPanelProps = {
  user: User | null;
  accentColor: "green" | "amber";
  roleLabel: "Farmer" | "Buyer";
  onSaved?: (user: User) => void;
};

type FormState = {
  name: string;
  email: string;
  businessName: string;
  phone: string;
};

const inputCls =
  "w-full border px-3 py-2 text-sm font-sans outline-none transition-colors duration-200";

const inputStyle = {
  borderColor: "var(--border-default)",
  backgroundColor: "var(--surface-base)",
  color: "var(--foreground)",
} as const;

function toFormState(user: User | null): FormState {
  return {
    name: user?.name ?? "",
    email: user?.email ?? "",
    businessName: user?.businessName ?? "",
    phone: user?.phone ?? "",
  };
}

export default function ProfileSettingsPanel({
  user,
  accentColor,
  roleLabel,
  onSaved,
}: ProfileSettingsPanelProps) {
  const accentHex = accentColor === "green" ? "#16a34a" : "#d97706";
  const accentBg = accentColor === "green" ? "#f0fdf4" : "#fffbeb";
  const accentBorder = accentColor === "green" ? "#bbf7d0" : "#fde68a";
  const accentText = accentColor === "green" ? "#166534" : "#92400e";

  const [form, setForm] = useState<FormState>(toFormState(user));
  const [originalForm, setOriginalForm] = useState<FormState>(toFormState(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const next = toFormState(user);
    setForm(next);
    setOriginalForm(next);
  }, [user]);

  const hasChanges = useMemo(() => {
    return (
      form.name.trim() !== originalForm.name.trim() ||
      form.businessName.trim() !== originalForm.businessName.trim() ||
      form.phone.trim() !== originalForm.phone.trim()
    );
  }, [form, originalForm]);

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const resetChanges = () => {
    setForm(originalForm);
    setError(null);
    setSuccess(null);
  };

  const persistProfile = async () => {
    setError(null);
    setSuccess(null);

    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          businessName: form.businessName,
          phone: form.phone,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to update profile.");
      }

      const data = (await response.json()) as { profile: User };
      const next = toFormState(data.profile);
      setForm(next);
      setOriginalForm(next);
      setSuccess("Profile updated successfully.");
      onSaved?.(data.profile);
      window.dispatchEvent(
        new CustomEvent("farmesh:profile-updated", { detail: data.profile })
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const requestSaveProfile = () => {
    setError(null);
    setSuccess(null);

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!hasChanges) {
      setSuccess("No changes to save.");
      return;
    }

    setConfirmOpen(true);
  };

  return (
    <div
      className="border p-6"
      style={{ borderColor: "var(--border-soft)", backgroundColor: "var(--surface-base)" }}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p
            className="mb-1 text-[11px] font-semibold tracking-[0.25em] uppercase"
            style={{ color: accentHex }}
          >
            Account Settings
          </p>
          <h3 className="font-serif text-2xl" style={{ color: "var(--foreground)" }}>
            Profile
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Update your contact and business details used for matching and coordination.
          </p>
        </div>
        <span
          className="border px-3 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase"
          style={{ borderColor: accentBorder, backgroundColor: accentBg, color: accentText }}
        >
          {roleLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(event) => handleFieldChange("name", event.target.value)}
            className={inputCls}
            style={inputStyle}
            disabled={saving}
          />
        </div>

        <div>
          <label
            className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            Email
          </label>
          <input type="email" value={form.email} className={inputCls} style={inputStyle} disabled />
          <p className="mt-1 text-xs" style={{ color: "var(--text-subtle)" }}>
            Email is read-only here.
          </p>
        </div>

        <div>
          <label
            className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            Business Name
          </label>
          <input
            type="text"
            value={form.businessName}
            onChange={(event) => handleFieldChange("businessName", event.target.value)}
            className={inputCls}
            style={inputStyle}
            disabled={saving}
          />
        </div>

        <div>
          <label
            className="mb-1 block text-[11px] font-semibold tracking-[0.12em] uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            Phone
          </label>
          <input
            type="text"
            value={form.phone}
            onChange={(event) => handleFieldChange("phone", event.target.value)}
            className={inputCls}
            style={inputStyle}
            disabled={saving}
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-4 text-sm" style={{ color: accentHex }}>{success}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={requestSaveProfile}
          disabled={saving}
          className="px-6 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase text-white transition-colors duration-300 disabled:opacity-60"
          style={{ backgroundColor: accentHex }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={resetChanges}
          disabled={saving || !hasChanges}
          className="border px-6 py-2.5 text-xs font-semibold tracking-[0.12em] uppercase transition-colors duration-300 disabled:opacity-60"
          style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}
        >
          Reset
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Profile Changes"
        message="Save these updates to your profile details?"
        confirmLabel="Save Changes"
        cancelLabel="Cancel"
        accentColor={accentColor}
        busy={saving}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void persistProfile();
        }}
      />
    </div>
  );
}
