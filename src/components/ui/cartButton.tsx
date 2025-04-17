"use client";

import { useState, useEffect, useRef } from "react";
import { Cart } from "@/components/store/Cart";
import { ShoppingCart } from "lucide-react";
import { useStore } from "@/lib/context/StoreContext";
import { Dialog, DialogPanel } from "@headlessui/react";

export function FloatingCartButton() {
  const [open, setOpen] = useState(false);
  const [bounce, setBounce] = useState<null | "add" | "remove">(null);

  const { state } = useStore();
  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  // 🔥 Bounce when totalItems increases
  const prevTotalRef = useRef(totalItems);

  useEffect(() => {
    if (prevTotalRef.current === totalItems) return;

    if (totalItems > prevTotalRef.current) {
      setBounce("add");
    } else if (totalItems < prevTotalRef.current) {
      setBounce("remove");
    }

    prevTotalRef.current = totalItems;

    const timer = setTimeout(() => setBounce(null), 600);
    return () => clearTimeout(timer);
  }, [totalItems]);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary/90"
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5" />
          {bounce === "add" && (
            <span className="absolute -top-2 -right-2 text-xs text-white bg-green-500 px-1 py-0.5 rounded-full animate-ping">
              +1
            </span>
          )}
          {bounce === "remove" && (
            <span className="absolute -top-2 -right-2 text-xs text-white bg-red-500 px-1 py-0.5 rounded-full animate-ping">
              -1
            </span>
          )}
        </div>
        <span>{totalItems}</span>
      </button>

      {/* Cart modal */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Cart</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <Cart />
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
