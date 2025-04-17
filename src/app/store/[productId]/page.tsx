import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FloatingCartButton } from "@/components/ui/cartButton";
import { AddToCartButton } from "@/components/ui/addToCart"; // You'll need this
import Image from "next/image";

interface Props {
  params: {
    productId: string;
  };
}

export default async function ProductPage({ params }: Props) {
  const supabase = await createClient();
  const { productId } = await params;

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (!product) return notFound();

  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Product Image and Info */}
        <div className="flex flex-col md:flex-row lg:flex-col gap-8 lg:w-2/3">
          {/* Thumbnail */}
          <div className="w-full md:w-1/2 lg:w-full">
            <Image
              src={product.thumbnail_url || product.digital_file_url}
              alt={product.name}
              width={500}
              height={500}
              className="rounded-md object-cover w-full h-auto max-h-[400px]"
            />
          </div>

          {/* Product Info */}
          <div className="flex-1 space-y-4 md:w-1/2 lg:w-full">
            <h1 className="text-2xl sm:text-3xl font-bold">{product.name}</h1>
            <p className="text-gray-600">{product.description}</p>
            <p className="text-lg font-semibold">
              {product.currency} {product.price}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-sm text-gray-500">SKU: {product.sku}</p>
              <p className="text-sm text-gray-500">Type: {product.type}</p>
              <p className="text-sm text-gray-500">Status: {product.status}</p>
              <p className="text-sm text-gray-500">
                Stock: {product.stock_quantity}
              </p>
            </div>
            <div className="flex items-center justify-end mt-3">
              <AddToCartButton product={product} />
            </div>
          </div>
        </div>

        {/* Variants Section */}
        {variants && variants.length > 0 && (
          <div className="lg:w-1/3 space-y-4">
            <h2 className="text-xl sm:text-2xl font-semibold">
              Choose a Variant
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className="border rounded-lg p-4 flex flex-col sm:flex-row gap-4 hover:shadow transition"
                >
                  {/* Variant image */}
                  <div className="w-full sm:w-1/3 lg:w-full xl:w-1/3">
                    <Image
                      src={variant.thumbnail_url || variant.digital_product}
                      alt={variant.name}
                      width={200}
                      height={200}
                      className="rounded-md object-cover w-full h-auto max-h-[150px]"
                    />
                  </div>

                  {/* Info and Button */}
                  <div className="flex flex-col justify-between flex-1">
                    <div>
                      <p className="font-semibold text-lg">{variant.name}</p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {variant.description}
                      </p>
                      <p className="text-md font-bold mt-2">
                        {variant.currency} {variant.price}
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <p className="text-sm text-gray-500">
                          SKU: {variant.sku}
                        </p>
                        <p className="text-sm text-gray-500">
                          Stock: {variant.stock_quantity}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            variant.is_active
                              ? "bg-pink-100 text-pink-800"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {variant.is_active ? "active" : "stopped"}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            variant.is_default
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {variant.is_default ? "default" : "not default"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-3">
                      <AddToCartButton product={variant} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <FloatingCartButton />
    </div>
  );
}
