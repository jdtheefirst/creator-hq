"use client";

import { useAuth } from "@/lib/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProductActionsProps {
  productId: string;
}

export default function ProductActions({ productId }: ProductActionsProps) {
  const router = useRouter();
  const { supabase } = useAuth();

  const handleDelete = async () => {
    const confirmed = confirm("Are you sure you want to delete this product?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      alert("Failed to delete product.");
    } else {
      router.refresh(); // Refresh the page to reflect deletion
    }
  };

  return (
    <div className="flex gap-4">
      <Link
        href={`/dashboard/products/${productId}/edit`}
        className="text-blue-600 hover:text-blue-900"
      >
        Edit
      </Link>
      <button
        onClick={handleDelete}
        className="text-red-600 hover:text-red-900"
      >
        Delete
      </button>
    </div>
  );
}
