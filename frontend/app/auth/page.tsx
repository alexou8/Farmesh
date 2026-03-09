"use client";

import { Suspense } from "react";
import TravelConnectSignin from "@/components/ui/travel-connect-signin-1";

export default function AuthPage() {
  return (
    <Suspense>
      <TravelConnectSignin />
    </Suspense>
  );
}
