"use client";

import { createPortal } from "react-dom";

import AnimatedLoadingSkeleton from "@/components/ui/animated-loading-skeleton";

type LoadingOverlayProps = {
  open: boolean;
  title: string;
  message?: string;
  accentColor?: "green" | "amber";
};

export default function LoadingOverlay({
  open,
  title,
  message,
  accentColor = "green",
}: LoadingOverlayProps) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[4px]"
      role="dialog"
      aria-modal="true"
      aria-busy="true"
      aria-label={title}
    >
      <AnimatedLoadingSkeleton title={title} message={message} accentColor={accentColor} />
    </div>,
    document.body
  );
}
