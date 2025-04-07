"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Product, ProductType } from "@/types/store";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be positive"),
  currency: z.string().min(1, "Currency is required"),
  type: z.enum(["physical", "digital", "affiliate"]),
  status: z.enum(["draft", "published", "archived"]),
  stock_quantity: z
    .number()
    .positive("Stock quantity must be a positive number")
    .optional(),
  affiliate_url: z.string().url().optional().nullable(),
  thumbnail_url: z.string().url().optional().nullable(),
  digital_file_url: z.string().url().optional().nullable(),
});

interface ProductFormProps {
  initialData?: Product;
  onSubmit: { update: boolean; id: string | undefined };
  currencyOptions: { value: string; label: string }[];
}
// onSubmit: (data: z.infer<typeof productSchema>) => Promise<void>;
export function ProductForm({
  initialData,
  onSubmit,
  currencyOptions,
}: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialData?.thumbnail_url ?? null
  );
  const [digitalFilePreview, setDigitalFilePreview] = useState<string | null>(
    initialData?.digital_file_url ?? null
  );
  const supabase = createBrowserClient();

  useEffect(() => {
    let url: string | null = null;
    if (thumbnailFile) {
      url = URL.createObjectURL(thumbnailFile);
      setThumbnailPreview(url);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [thumbnailFile]);

  useEffect(() => {
    let url: string | null = null;
    if (digitalFile) {
      url = URL.createObjectURL(digitalFile);
      setDigitalFilePreview(url);
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [digitalFile]);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          stock_quantity: initialData.stock_quantity ?? undefined,
        }
      : {
          name: "",
          description: "",
          category: "",
          price: 0,
          currency: "USD",
          type: "physical" as ProductType,
          status: "draft",
          stock_quantity: undefined,
          affiliate_url: undefined,
          thumbnail_url: undefined,
          digital_file_url: undefined,
        },
  });

  const uploadToSupabase = async (
    file: File,
    folder: "thumbnails" | "digital"
  ): Promise<string> => {
    const timestamp = Date.now();
    const randomHash = Math.random().toString(36).substring(2, 8);
    const cleanName = file.name
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");
    const filePath = `products/${folder}/${timestamp}_${randomHash}_${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("products").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (data: z.infer<typeof productSchema>) => {
    try {
      setIsLoading(true);

      // Upload thumbnail
      if (thumbnailFile) {
        data.thumbnail_url = await uploadToSupabase(
          thumbnailFile,
          "thumbnails"
        );
      }

      // Upload digital product (only if it's a digital type)
      if (form.watch("type") === "digital" && digitalFile) {
        const allowedFormats = ["pdf", "mp3", "mp4", "zip"];
        const ext = digitalFile.name.split(".").pop()?.toLowerCase();

        if (!ext || !allowedFormats.includes(ext)) {
          throw new Error(
            `Invalid file format: .${ext}. Allowed: ${allowedFormats.join(", ")}`
          );
        }

        data.digital_file_url = await uploadToSupabase(digitalFile, "digital");
      }

      // Depending on the update flag, perform the correct action
      if (onSubmit.update) {
        // Update existing product
        await supabase
          .from("products")
          .update(data)
          .eq("id", onSubmit.id)
          .select()
          .single();
      } else {
        // Insert new product
        await supabase.from("products").insert(data).select().single();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit product"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Product Name</label>
          <Input
            {...form.register("name")}
            placeholder="Enter product name"
            className="w-full"
          />
          {form.formState.errors.name && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Textarea
            {...form.register("description")}
            placeholder="Enter product description"
            className="w-full h-32"
          />
          {form.formState.errors.description && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <Input
            type="text"
            {...form.register("category")}
            className="w-full"
          />
          {form.formState.errors.category && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.category.message}
            </p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <Input
            type="number"
            step="0.01"
            {...form.register("price", { valueAsNumber: true })}
            placeholder="0.00"
            className="w-full"
          />
          {form.formState.errors.price && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.price.message}
            </p>
          )}
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium mb-1">Currency</label>
          <Select
            {...form.register("currency")}
            defaultValue={initialData?.currency || "USD"}
          >
            <SelectTrigger>
              {/* This is the visible part of the select dropdown */}
              <div>{initialData?.currency || "USD"}</div>
            </SelectTrigger>

            <SelectContent>
              {/* Wrap SelectItems within SelectContent */}
              {currencyOptions &&
                currencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {form.formState.errors.currency && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.currency.message}
            </p>
          )}
        </div>

        {/* Type */}
        <label className="block text-sm font-medium mb-1">Product Type</label>
        <Select
          {...form.register("type")}
          defaultValue={initialData?.type || "physical"}
        >
          <SelectTrigger>
            <div>{initialData?.type || "physical"}</div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="physical">Physical Product</SelectItem>
            <SelectItem value="digital">Digital Product</SelectItem>
            <SelectItem value="affiliate">Affiliate Product</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.type && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.type.message}
          </p>
        )}
      </div>

      {/* Stock */}
      {form.watch("type") === "physical" && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Stock Quantity
          </label>
          <Input
            type="number"
            {...form.register("stock_quantity", { valueAsNumber: true })}
            defaultValue={initialData?.stock_quantity || 1}
            placeholder="Enter stock quantity"
            className="w-full"
            min={1}
          />
        </div>
      )}

      {/* Affiliate URL */}
      {form.watch("type") === "affiliate" && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Affiliate URL
          </label>
          <Input
            {...form.register("affiliate_url")}
            placeholder="Enter affiliate URL"
            className="w-full"
          />
        </div>
      )}

      {/* Thumbnail Upload */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Thumbnail Image
        </label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
          className="w-full"
        />
        {thumbnailPreview && (
          <img
            src={thumbnailPreview}
            alt="Thumbnail Preview"
            className="mt-2 max-w-xs border rounded"
          />
        )}
      </div>

      {/* Digital File Upload */}
      {form.watch("type") === "digital" && (
        <div>
          <label className="block text-sm font-medium mb-1">Digital File</label>
          <Input
            type="file"
            onChange={(e) => setDigitalFile(e.target.files?.[0] || null)}
            className="w-full"
          />

          {digitalFilePreview && (
            <a
              href={digitalFilePreview}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-sm text-blue-600 underline block"
            >
              {digitalFile?.name ?? digitalFilePreview.split("/").pop()}
            </a>
          )}
        </div>
      )}

      {/* Status */}
      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <Select
          {...form.register("status")}
          defaultValue={initialData?.status || "draft"}
        >
          <SelectTrigger>
            <div>{initialData?.status || "draft"}</div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.status && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.status.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading
          ? "Saving..."
          : initialData
            ? "Update Product"
            : "Create Product"}
      </Button>
    </form>
  );
}
