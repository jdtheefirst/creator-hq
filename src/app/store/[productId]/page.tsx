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

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.productId)
    .eq("status", "published")
    .single();

  if (!product) return notFound();

  const { data: variants } = await supabase
    .from("variants")
    .select("*")
    .eq("product_id", product.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Thumbnail */}
        {product.thumbnail_url && (
          <Image
            src={product.thumbnail_url}
            alt={product.name}
            width={500}
            height={500}
            className="rounded-md object-cover max-h-[400px]"
          />
        )}

        {/* Product Info */}
        <div className="flex-1 space-y-4">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-gray-600">{product.description}</p>

          {variants && variants.length > 0 ? (
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Variants</h2>
              <ul className="space-y-1">
                {variants.map((variant) => (
                  <li
                    key={variant.id}
                    className="flex justify-between items-center border rounded p-3"
                  >
                    <div>
                      <p className="font-medium">{variant.name}</p>
                      <p className="text-sm text-gray-500">
                        {variant.currency} {variant.price}
                      </p>
                    </div>
                    <AddToCartButton product={product} variant={variant} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold">
                {product.currency} {product.price}
              </p>
              <AddToCartButton product={product} />
            </div>
          )}
        </div>
      </div>

      <FloatingCartButton />
    </div>
  );
}
