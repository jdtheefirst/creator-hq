"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { Product } from "@/types/store";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProductActionsProps {
  product: Product;
}

export default function ProductActions({ product }: ProductActionsProps) {
  const router = useRouter();
  const { supabase, deleteFileFromSupabase, debouncePromise } = useAuth();

  const handleDelete = async () => {
    const confirmed = confirm(
      "Are you sure you want to delete this product and all related files?"
    );
    if (!confirmed) return;

    // 1. Get variant file URLs BEFORE deleting anything
    const { data: variants, error: variantFetchError } = await supabase
      .from("variants")
      .select("thumbnail_url, digital_file_url")
      .eq("product_id", product.id);

    if (variantFetchError) {
      alert("Failed to fetch variant files.");
      return;
    }

    // 2. Delete product files
    if (product.thumbnail_url) {
      await deleteFileFromSupabase(product.thumbnail_url, "products");
    }
    if (product.digital_file_url) {
      await deleteFileFromSupabase(product.digital_file_url, "products");
    }

    // 3. Delete variant files
    for (const variant of variants || []) {
      await deleteFileFromSupabase(variant.thumbnail_url, "products");
      await deleteFileFromSupabase(variant.digital_file_url, "products");
    }

    // 4. Delete product from DB (variants will cascade)
    const { error: productDeleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (productDeleteError) {
      alert("Failed to delete product from database.");
    } else {
      alert("Product and all related files deleted.");
      router.refresh();
    }
  };

  const debouncedDelete = debouncePromise(handleDelete, 500);

  return (
    <div className="flex gap-4">
      <Link
        href={`/dashboard/products/${product.id}/edit`}
        className="text-blue-600 hover:text-blue-900"
      >
        Edit
      </Link>
      <button
        onClick={debouncedDelete}
        className="text-red-600 hover:text-red-900"
      >
        Delete
      </button>
    </div>
  );
}
