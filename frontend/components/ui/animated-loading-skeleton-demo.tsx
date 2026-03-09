"use client";

import AnimatedLoadingSkeleton from "@/components/ui/animated-loading-skeleton";

export function SkeletonDemo() {
  return (
    <AnimatedLoadingSkeleton
      title="Running Matching"
      message="Normalizing open data and generating best matches."
      accentColor="green"
    />
  );
}
