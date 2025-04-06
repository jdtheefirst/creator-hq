import { Suspense } from "react";
import { ProductGrid } from "@/components/store/ProductGrid";
import { Cart } from "@/components/store/Cart";
import { createClient } from "@/lib/supabase/server";

export default async function StorePage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-6">Store</h1>
          <Suspense fallback={<div>Loading products...</div>}>
            <ProductGrid products={products || []} />
          </Suspense>
        </div>
        <div className="lg:col-span-1">
          <Cart />
        </div>
      </div>
    </div>
  );
}
