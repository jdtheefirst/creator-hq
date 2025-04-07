import { notFound } from "next/navigation";
import { ProductForm } from "@/components/store/ProductForm";
import { createClient } from "@/lib/supabase/server";

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Edit Product</h1>
        <ProductForm
          initialData={product}
          onSubmit={{ update: true, id: params.id }}
        />
      </div>
    </div>
  );
}
