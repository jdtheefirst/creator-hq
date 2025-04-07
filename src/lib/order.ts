// src/lib/order.ts
import { createClient } from "@/lib/supabase/server";
import { CartItem } from "@/types/store";

export async function placeOrder(cartItems: CartItem[], userId: string) {
  const supabase = await createClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        user_id: userId,
        status: "pending",
        total_amount: calculateTotal(cartItems),
      },
    ])
    .select()
    .single();

  if (orderError) throw new Error(orderError.message);

  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.product.id,
    variant_id: item.variant?.id || null,
    quantity: item.quantity,
    unit_price: item.product.price,
    currency: item.product.currency,
  }));

  const { error: orderItemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (orderItemsError) throw new Error(orderItemsError.message);

  return order;
}

function calculateTotal(cartItems: CartItem[]) {
  return cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
}
