"use client";

import { useEffect, useRef, useState } from "react";
import { Product } from "@/types/store";
import { useStore } from "@/lib/context/StoreContext";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface ProductGridProps {
  products: Product[];
}

const BATCH_SIZE = 12;

export function ProductGrid({ products }: ProductGridProps) {
  const { dispatch } = useStore();
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const handleAddToCart = (product: Product) => {
    dispatch({
      type: "ADD_TO_CART",
      payload: {
        product,
        quantity: 1,
      },
    });
  };

  const filteredProducts = products.filter((p) =>
    filterCategory ? p.category === filterCategory : true
  );

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + BATCH_SIZE);
        }
      },
      {
        threshold: 1.0,
      }
    );

    observerRef.current.observe(loadMoreRef.current);
  }, [visibleCount, filterCategory]);

  useEffect(() => {
    // Reset scroll count when filter changes
    setVisibleCount(BATCH_SIZE);
  }, [filterCategory]);

  return (
    <>
      <div className="flex gap-4 mb-4">
        <Select
          onValueChange={(value) => setFilterCategory(value || null)}
          defaultValue={filterCategory || ""}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>

          {/* This is the dropdown menu */}
          <SelectContent>
            {[...new Set(products.map((p) => p.category))].map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleProducts.map((product) => (
          <div
            key={product.id}
            className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col"
          >
            <Link href={`/store/${product.id}`} className="block">
              <Image
                width={300}
                height={300}
                loading="lazy"
                priority={false}
                placeholder="blur"
                blurDataURL={
                  product.thumbnail_url! || product.digital_file_url!
                }
                src={product.thumbnail_url! || product.digital_file_url!}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
            </Link>

            <div className="p-4 flex flex-col flex-grow justify-between">
              <div>
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <p className="text-gray-600 mt-1 line-clamp-2">
                  {product.description}
                </p>
                <p className="text-sm text-gray-500 mt-1">{product.category}</p>
                <p className="text-sm text-gray-500 mt-1">
                  SKU: {product.sku || "N/A"}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.is_active
                        ? "bg-pink-100 text-pink-800"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    active: {product.is_active ? "yes" : "no"}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.is_default
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    default: {product.is_default ? "yes" : "no"}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.variants_count > 0
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    variants: {product.variants_count}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold">
                  {formatCurrency(product.price, product.currency)}
                </span>
                {product.type === "affiliate" ? (
                  <a
                    href={product.affiliate_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
                  >
                    Buy Now
                  </a>
                ) : (
                  <button
                    onClick={() =>
                      handleAddToCart({
                        ...product,
                        purchasable_type: "product",
                      })
                    }
                    className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Infinite Scroll trigger */}
      <div ref={loadMoreRef} className="h-12" />

      {visibleCount < filteredProducts.length ? (
        <div className="text-center text-sm text-gray-500 mt-4">
          Loading more...
        </div>
      ) : (
        <div className="text-center text-sm text-gray-400 mt-4">
          No more products
        </div>
      )}
    </>
  );
}
