"use client";

import { useAuth } from "@/lib/context/AuthContext";

export default async function OrdersPage() {
  const { user, supabase } = useAuth();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  if (error) {
    return <div>Error loading orders</div>;
  }

  return (
    <div>
      <h1>Your Orders</h1>
      <ul>
        {orders.map((order: any) => (
          <li key={order.id}>
            <p>Order ID: {order.id}</p>
            <p>Status: {order.status}</p>
            <p>Total: ${order.total_amount}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
