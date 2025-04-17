"use client";

import { useState } from "react";
import { Cart } from "@/components/store/Cart";
import { ShoppingCart } from "lucide-react";
import { useStore } from "@/lib/context/StoreContext";
import { Dialog, DialogPanel } from "@headlessui/react";

export function FloatingCartButton() {
  const [open, setOpen] = useState(false);
  const { state } = useStore();

  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary/90"
      >
        <ShoppingCart className="w-5 h-5" />
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
          <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
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
