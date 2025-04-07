// src/app/dashboard/orders/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface orderProps {
  params: { id: string };
}

export default async function OrderDetailsPage({ params }: orderProps) {
  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params?.id)
    .single();

  if (error || !order) {
    notFound();
  }

  return (
    <div>
      <h1>Order Details</h1>
      <p>Order ID: {order.id}</p>
      <p>Status: {order.status}</p>
      <p>Total: ${order.total_amount}</p>
      {/* Display order items */}
    </div>
  );
}
