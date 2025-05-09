"use client";

import { Suspense } from "react";
import CheckoutPageContent from "@/components/CheckOut";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center">Loading checkout...</div>}
    >
      <CheckoutPageContent />
    </Suspense>
  );
}
