import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import ProductForm from "@/components/ProductForm";

export default async function NewProductPage() {
  const supabase = createServerComponentClient({ cookies });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">New Product</h1>
        <ProductForm />
      </div>
    </div>
  );
}
