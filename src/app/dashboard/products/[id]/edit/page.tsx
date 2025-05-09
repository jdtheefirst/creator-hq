import { notFound } from "next/navigation";
import { ProductForm } from "@/components/store/ProductForm";
import { createClient } from "@/lib/supabase/server";
import { getCurrencyOptions } from "@/lib/utils";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const currencyOptions = getCurrencyOptions();
  const { id } = params;

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", id);

  if (error || !product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Edit Product</h1>
        <ProductForm
          initialData={{ product, variants: variants || [] }}
          onSubmit={{ update: true, id }}
          currencyOptions={currencyOptions}
        />
      </div>
    </div>
  );
}
