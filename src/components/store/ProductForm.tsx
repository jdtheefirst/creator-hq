"use client";

import { useState, useEffect } from "react";
import { useFieldArray, useForm, Path } from "react-hook-form";
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
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

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
  variants: z
    .array(
      z.object({
        name: z.string().min(1, "Variant name is required"),
        price: z.number().min(0, "Price must be positive"),
        currency: z.string().min(1, "Currency is required"),
        sku: z.string().optional(),
        stock_quantity: z.number().min(0).optional(),
        is_default: z.boolean().optional(),
        is_active: z.boolean().optional(),
        thumbnail_url: z.string().url().optional().nullable(),
        digital_file_url: z.string().url().optional().nullable(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .optional(),
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
  const [uploading, setUploading] = useState(false);
  const { supabase } = useAuth();

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
          variants: initialData.variants?.map((variant) => ({
            ...variant,
            stock_quantity: variant.stock_quantity ?? undefined,
            sku: variant.sku ?? undefined, // Convert null to undefined
          })),
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
          variants: [],
        },
  });

  const { control } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
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

  const handleUpload = async (
    file: File,
    index: number,
    type: "thumbnail_url" | "digital_file_url"
  ) => {
    try {
      setUploading(true);
      const folder = type === "thumbnail_url" ? "thumbnails" : "digital";
      const url = await uploadToSupabase(file, folder);
      form.setValue(
        `variants.${index}.${type}` as Path<z.infer<typeof productSchema>>,
        url
      );
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
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
            accept=".pdf,.mp3,.mp4,.zip"
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

      {/* Variants */}
      <div className="space-y-6 mt-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Product Variants</h3>
          <Button
            type="button"
            onClick={() =>
              append({
                name: "",
                price: 0,
                currency: "USD",
                sku: "",
                stock_quantity: 0,
                is_default: false,
                is_active: true,
                thumbnail_url: "",
                digital_file_url: "",
                metadata: {},
              })
            }
          >
            + Add Variant
          </Button>
        </div>

        {fields.map((field, index) => {
          const variant = form.watch(`variants.${index}`);

          return (
            <div
              key={field.id}
              className="p-4 border rounded-lg space-y-4 bg-muted/10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  {...form.register(`variants.${index}.name`)}
                  placeholder="Variant Name"
                />
                <Input
                  type="number"
                  {...form.register(`variants.${index}.price`, {
                    valueAsNumber: true,
                  })}
                  placeholder="Price"
                />
                <Input
                  {...form.register(`variants.${index}.currency`)}
                  placeholder="Currency (e.g. USD)"
                />
                <Input
                  {...form.register(`variants.${index}.sku`)}
                  placeholder="SKU"
                />
                <Input
                  type="number"
                  {...form.register(`variants.${index}.stock_quantity`, {
                    valueAsNumber: true,
                  })}
                  placeholder="Stock Quantity"
                />

                {/* Switches */}
                <div className="flex items-center gap-2">
                  <Switch {...form.register(`variants.${index}.is_default`)} />
                  <Label>Default</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch {...form.register(`variants.${index}.is_active`)} />
                  <Label>Active</Label>
                </div>
              </div>

              {/* File Uploads */}
              <div className="flex flex-col gap-2 md:flex-row md:gap-6">
                <div>
                  <Label>Thumbnail</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, index, "thumbnail_url");
                    }}
                  />
                  {variant.thumbnail_url && (
                    <img
                      src={variant.thumbnail_url}
                      alt="Thumbnail"
                      className="mt-2 w-24 h-24 object-cover rounded"
                    />
                  )}
                </div>

                <div>
                  <Label>Digital File</Label>
                  <Input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, index, "digital_file_url");
                    }}
                  />
                  {variant.digital_file_url && (
                    <p className="text-sm text-green-600 mt-2">
                      File uploaded ✔
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant="destructive"
                onClick={() => remove(index)}
              >
                Remove Variant
              </Button>
            </div>
          );
        })}
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
