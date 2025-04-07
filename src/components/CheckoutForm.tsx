// src/components/CheckoutForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/context/AuthContext";
import { placeOrder } from "@/lib/order";
import { useCart } from "@/lib/context/StoreContext";
import { toast } from "sonner";

const checkoutSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  address: z.string().optional(),
  instructions: z.string().optional(),
});

export function CheckoutForm() {
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();
  const form = useForm({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (data: z.infer<typeof checkoutSchema>) => {
    try {
      if (!user) return;
      await placeOrder(cartItems, user.id);
      clearCart();
      toast.success("Order placed successfully!");
    } catch (error: any) {
      toast.error("Failed to place order: " + error.message);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>Name</label>
        <input {...form.register("name")} />
        {form.formState.errors.name && (
          <p>{form.formState.errors.name.message}</p>
        )}
      </div>
      <div>
        <label>Email</label>
        <input type="email" {...form.register("email")} />
        {form.formState.errors.email && (
          <p>{form.formState.errors.email.message}</p>
        )}
      </div>
      <div>
        <label>Address</label>
        <input {...form.register("address")} />
      </div>
      <div>
        <label>Instructions</label>
        <textarea {...form.register("instructions")} />
      </div>
      <button type="submit">Place Order</button>
    </form>
  );
}
