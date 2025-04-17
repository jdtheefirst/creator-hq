import { Suspense } from "react";
import { ProductGrid } from "@/components/store/ProductGrid";
import { createClient } from "@/lib/supabase/server";
import { FloatingCartButton } from "@/components/ui/cartButton";

export default async function StorePage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("status", "published")
    .eq("creator_id", process.env.NEXT_PUBLIC_CREATOR_UID)
    .order("created_at", { ascending: false });
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-6">Store</h1>
          <Suspense fallback={<div>Loading products...</div>}>
            <ProductGrid products={products || []} />
          </Suspense>
        </div>
        <FloatingCartButton />
      </div>
    </div>
  );
}
