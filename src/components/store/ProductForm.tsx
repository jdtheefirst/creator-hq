"use client";

import { useState, useEffect, useRef } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
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
  SelectValue,
} from "@/components/ui/select";
import {
  Product,
  ProductStatus,
  ProductType,
  ProductVariant,
} from "@/types/store";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { FileIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { cleanObject } from "@/lib/utils";

const variantSchema = z.object({
  id: z.string().optional(),
  product_id: z.string().optional(),
  name: z.string().min(1, "Variant name is required"),
  price: z.number().min(0, "Price must be positive"),
  currency: z.string().min(1, "Currency is required"),
  sku: z.string().optional(),
  stock_quantity: z.number().min(0).optional(),
  is_default: z.boolean().optional(),
  is_active: z.boolean().optional(),

  affiliate_url: z.string().url().or(z.literal("")).optional().nullable(),
  thumbnail_url: z.string().url().optional().nullable(),
  thumbnail_file: z.any().optional().nullable(),
  digital_file: z.any().optional().nullable(),
  digital_file_url: z.string().url().or(z.literal("")).optional().nullable(),
});

const productSchema = z
  .object({
    id: z.string().optional(),
    creator_id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    category: z.string().min(1, "Category is required"),
    price: z.number().min(0, "Price must be positive"),
    currency: z.string().min(1, "Currency is required"),
    type: z.enum(["physical", "digital", "affiliate"]),
    status: z.enum(["draft", "published"]),
    stock_quantity: z
      .number()
      .positive("Stock quantity must be a positive number")
      .optional(),

    affiliate_url: z.string().url().or(z.literal("")).optional().nullable(),
    thumbnail_url: z.string().url().optional().nullable(),
    thumbnail_file: z.any().optional().nullable(),
    digital_file: z.any().optional().nullable(),
    digital_file_url: z.string().url().or(z.literal("")).optional().nullable(),

    variants: z.array(variantSchema).optional(),
  })
  .superRefine((data, ctx) => {
    const { type } = data;

    // 🔍 Validate product-level fields by type
    if (type === "affiliate") {
      if (!data.affiliate_url) {
        ctx.addIssue({
          path: ["affiliate_url"],
          code: z.ZodIssueCode.custom,
          message: "Affiliate product must include affiliate URL.",
        });
      }
      if (!data.thumbnail_url && !data.thumbnail_file) {
        ctx.addIssue({
          path: ["thumbnail_file"],
          code: z.ZodIssueCode.custom,
          message: "Affiliate product must include thumbnail.",
        });
      }
    }

    if (type === "digital") {
      if (!data.digital_file_url && !data.digital_file) {
        ctx.addIssue({
          path: ["digital_file"],
          code: z.ZodIssueCode.custom,
          message: "Digital product must include a digital file.",
        });
      }
    }

    if (type === "physical") {
      if (!data.thumbnail_url && !data.thumbnail_file) {
        ctx.addIssue({
          path: ["thumbnail_file"],
          code: z.ZodIssueCode.custom,
          message: "Physical product must include a thumbnail.",
        });
      }
      if (!data.stock_quantity) {
        ctx.addIssue({
          path: ["stock_quantity"],
          code: z.ZodIssueCode.custom,
          message: "Physical product must include stock quantity.",
        });
      }
    }

    // 🔁 Validate each variant under same rules
    for (const [i, variant] of (data.variants ?? []).entries()) {
      if (type === "affiliate") {
        if (!variant.affiliate_url) {
          ctx.addIssue({
            path: [`variants`, i, "affiliate_url"],
            code: z.ZodIssueCode.custom,
            message: "Affiliate variant must include affiliate URL.",
          });
        }
        if (!variant.thumbnail_url && !variant.thumbnail_file) {
          ctx.addIssue({
            path: [`variants`, i, "thumbnail_file"],
            code: z.ZodIssueCode.custom,
            message: "Affiliate variant must include a thumbnail.",
          });
        }
      }

      if (type === "digital") {
        if (!variant.digital_file_url && !variant.digital_file) {
          ctx.addIssue({
            path: [`variants`, i, "digital_file"],
            code: z.ZodIssueCode.custom,
            message: "Digital variant must include a file.",
          });
        }
      }

      if (type === "physical") {
        if (!variant.thumbnail_url && !variant.thumbnail_file) {
          ctx.addIssue({
            path: [`variants`, i, "thumbnail_file"],
            code: z.ZodIssueCode.custom,
            message: "Physical variant must include a thumbnail.",
          });
        }
      }
    }
  });

interface ProductFormProps {
  initialData?: {
    product: Product;
    variants: ProductVariant[];
  };
  onSubmit: {
    update: boolean;
    id?: string;
  };
  currencyOptions: { value: string; label: string }[];
}

// onSubmit: (data: z.infer<typeof productSchema>) => Promise<void>;
export function ProductForm({
  initialData,
  onSubmit,
  currencyOptions,
}: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { supabase, user, debouncePromise, deleteFileFromSupabase } = useAuth();
  const router = useRouter();
  const isSubmitting = useRef(false);
  const [removingIndex, setRemovingIndex] = useState(false);
  const debouncedDelete = debouncePromise(deleteFileFromSupabase, 500);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData
      ? {
          ...initialData.product,
          stock_quantity: initialData.product.stock_quantity ?? undefined,
          thumbnail_file: null,
          digital_file: null,
          variants: initialData.variants?.map((variant) => ({
            ...variant,
            stock_quantity: variant.stock_quantity ?? undefined,
            sku: variant.sku ?? undefined,
            is_default: variant.is_default ?? false,
            is_active: variant.is_active ?? false,
            thumbnail_file: undefined,
            digital_file: undefined,
            thumbnail_url: variant.thumbnail_url ?? undefined,
            digital_file_url: variant.digital_file_url ?? undefined,
          })),
        }
      : {
          name: "",
          description: "",
          category: "",
          price: 0,
          currency: "USD",
          type: "physical" as ProductType,
          status: "draft" as ProductStatus,
          stock_quantity: undefined,
          affiliate_url: undefined,
          thumbnail_url: undefined,
          digital_file_url: undefined,
          thumbnail_file: undefined,
          digital_file: undefined,
          variants: [],
        },
  });

  const { control } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const handleRemoveVariant = async (index: number) => {
    if (removingIndex) return;
    setRemovingIndex(true);
    try {
      if (onSubmit.update) {
        const variant = form.getValues(`variants.${index}`);
        if (!variant) {
          toast.error("Variant ID not found for deletion");
          return;
        }

        await supabase.from("product_variants").delete().eq("id", variant.id);
        remove(index);
        initialData?.variants.splice(index, 1); // Remove from initialData
        toast.success("Variant deleted successfully!");
      } else {
        remove(index);
      }
    } catch (error) {
      console.log("Error removing variant:", error);
      toast.error("Failed to delete variant. Please try again.");
    } finally {
      setRemovingIndex(false);
    }
  };

  const uploadToSupabase = async (
    file: File,
    folder: "thumbnails" | "digital" | "variant-thumbnails" | "variant-digital"
  ): Promise<string> => {
    const timestamp = Date.now();
    const randomHash = Math.random().toString(36).substring(2, 8);
    const cleanName = file.name
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9._-]/g, "");
    const filePath = `${user?.id}/${folder}/${timestamp}_${randomHash}_${cleanName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("products").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      // Delete partially uploaded files
      await supabase.storage.from("products").remove([filePath]);
      throw error;
    }
  };

  // Image-specific handler
  const handleImageChange = (
    field: `thumbnail_file` | `variants.${number}.thumbnail_file`,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image exceeds 5MB limit");
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    form.setValue(field.replace("_file", "_url") as any, previewUrl);
    form.setValue(field as any, file);
  };

  // Digital file handler
  const handleDigitalChange = (
    field: `digital_file` | `variants.${number}.digital_file`,
    e: React.ChangeEvent<HTMLInputElement>,
    maxSizeMB: number = 10
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "mp3", "mp4", "zip"].includes(ext || "")) {
      toast.error(`Invalid file type. Allowed: PDF, MP3, MP4, ZIP`);
      e.target.value = "";
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File exceeds ${maxSizeMB}MB limit`);
      e.target.value = "";
      return;
    }

    // Only store filename, no blob URL
    form.setValue(field.replace("_file", "_url") as any, file.name);
    form.setValue(field as any, file);
  };

  // Cleanup only blob URLs when component unmounts (not during submission)
  useEffect(() => {
    return () => {
      if (isSubmitting.current) return;

      const revokeBlobUrl = (url: string | null | undefined) => {
        if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
      };

      // Main product
      revokeBlobUrl(form.getValues("thumbnail_url"));

      // Variants
      form.getValues("variants")?.forEach((variant) => {
        revokeBlobUrl(variant.thumbnail_url);
      });
    };
  }, []);

  const handleSubmit = async (data: z.infer<typeof productSchema>) => {
    if (isLoading || isSubmitting.current) return;

    try {
      setIsLoading(true);
      isSubmitting.current = true;

      // 🔼 Upload product-level files
      if (data.thumbnail_file) {
        data.thumbnail_url = await uploadToSupabase(
          data.thumbnail_file,
          "thumbnails"
        );
      }

      if (data.digital_file) {
        const ext = data.digital_file.name.split(".").pop()?.toLowerCase();
        if (!["pdf", "mp3", "mp4", "zip"].includes(ext || "")) {
          throw new Error(`Invalid file type: .${ext}`);
        }
        data.digital_file_url = await uploadToSupabase(
          data.digital_file,
          "digital"
        );
      }

      // 🧼 Upload variant files
      for (const variant of data.variants ?? []) {
        if (variant.thumbnail_file) {
          variant.thumbnail_url = await uploadToSupabase(
            variant.thumbnail_file,
            "variant-thumbnails"
          );
        }
        if (variant.digital_file) {
          variant.digital_file_url = await uploadToSupabase(
            variant.digital_file,
            "variant-digital"
          );
        }
      }

      // ✂️ Split product and variants
      const { variants, ...productData } = data;
      const variantsWithIds = initialData?.variants?.map((original, i) => ({
        ...original,
        ...(variants?.[i] ?? {}),
      }));

      // 🧼 Clean the data
      const cleanProductData = cleanObject(productData);
      const cleanVariants = variantsWithIds?.map(cleanObject);

      // 🆙 Insert or update product
      const { data: upsertedProduct, error: productError } = onSubmit.update
        ? await supabase
            .from("products")
            .update(cleanProductData)
            .eq("id", onSubmit.id)
            .eq("creator_id", user?.id)
            .select()
            .single()
        : await supabase
            .from("products")
            .insert({
              ...cleanProductData,
              creator_id: user?.id,
            })
            .select()
            .single();

      if (productError || !upsertedProduct) throw productError;

      // 🔁 Upsert variants if any
      if (cleanVariants?.length) {
        const variantUpserts = cleanVariants.map((v) => ({
          ...v,
          product_id: upsertedProduct.id,
        }));

        const { error: variantError } = await supabase
          .from("product_variants")
          .upsert(variantUpserts, { onConflict: ["id"] });

        if (variantError) throw variantError;
      }

      toast.success("Product saved successfully!");
      router.push("/dashboard/products");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      isSubmitting.current = false;
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

          <Controller
            name="currency"
            control={form.control}
            defaultValue={initialData?.product.currency || "USD"}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  {/* You can also use SelectValue for better accessibility */}
                  <SelectValue placeholder="Select Currency" />
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
            )}
          />
          {form.formState.errors.currency && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.currency.message}
            </p>
          )}
        </div>

        {/* Type */}
        <label className="block text-sm font-medium mb-1">Product Type</label>
        <Controller
          name="type"
          control={form.control}
          defaultValue={initialData?.product.type || "physical"}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={!!initialData}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="physical">Physical Product</SelectItem>
                <SelectItem value="digital">Digital Product</SelectItem>
                <SelectItem value="affiliate">Affiliate Product</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
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
            defaultValue={initialData?.product.stock_quantity || 1}
            placeholder="Enter stock quantity"
            className="w-full"
            min={1}
          />
          {form.formState.errors.stock_quantity && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.stock_quantity.message}
            </p>
          )}
        </div>
      )}

      {/* Affiliate URL */}
      {(form.watch("type") === "affiliate" || form.watch("affiliate_url")) && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Affiliate URL
          </label>
          <Input
            {...form.register("affiliate_url")}
            defaultValue={initialData?.product.affiliate_url || ""}
            placeholder="Enter affiliate URL"
            className="w-full"
          />
          {form.formState.errors.affiliate_url && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.affiliate_url.message}
            </p>
          )}
        </div>
      )}

      {/* Thumbnail Upload */}
      {(form.watch("type") === "physical" ||
        form.watch("type") === "affiliate") && (
        <div className="space-y-2">
          <Label>Product Thumbnail (Max 5MB)</Label>
          <Input
            type="file"
            accept="image/*"
            id="main-thumbnail-upload"
            onChange={(e) => {
              handleImageChange("thumbnail_file", e);
            }}
          />
          {form.formState.errors.thumbnail_file && (
            <p className="text-sm text-red-500">
              {String(form.formState.errors.thumbnail_file?.message || "")}
            </p>
          )}

          {/* Thumbnail Preview Section */}

          {(form.watch("thumbnail_url") ||
            form.getValues("thumbnail_file")) && (
            <div className="mt-2 flex items-center gap-2">
              <img
                src={
                  form.getValues("thumbnail_file")
                    ? URL.createObjectURL(form.getValues("thumbnail_file"))
                    : form.watch("thumbnail_url")!
                }
                className="w-16 h-16 object-cover rounded border"
                alt="Thumbnail preview"
              />
              <div className="flex flex-col gap-1">
                {form.getValues("thumbnail_file") && (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      New file: {form.getValues("thumbnail_file")?.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Size:{" "}
                      {(
                        form.getValues("thumbnail_file")?.size /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      MB
                    </span>
                  </div>
                )}
                {form.watch("thumbnail_url")?.startsWith("http") && (
                  <span className="text-xs text-muted-foreground">
                    Current: {form.watch("thumbnail_url")?.split("/").pop()}
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={async () => {
                  const thumbnailUrl = form.getValues("thumbnail_url");

                  // If it's a real Supabase URL
                  if (thumbnailUrl && thumbnailUrl.startsWith("https://")) {
                    const deleted = await debouncedDelete(
                      thumbnailUrl!,
                      "products"
                    );
                    if (deleted) {
                      toast.success("Thumbnail deleted!");
                    } else {
                      toast.error("Failed to delete thumbnail");
                    }
                  }
                  // If it's a blob URL, revoke it
                  if (thumbnailUrl?.startsWith("blob:")) {
                    URL.revokeObjectURL(thumbnailUrl);
                  }
                  // Clear form values
                  form.setValue("thumbnail_url", null);
                  form.setValue("thumbnail_file", null);
                  // Clear file input value
                  const fileInput = document.getElementById(
                    "main-thumbnail-upload"
                  ) as HTMLInputElement;
                  if (fileInput) fileInput.value = "";
                }}
              >
                <TrashIcon className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Digital Upload */}
      {form.watch("type") === "digital" && (
        <div className="space-y-2">
          <Label>Digital File (Max 10MB)</Label>
          <Input
            type="file"
            accept=".pdf,.mp3,.mp4,.zip"
            id="main-digital-upload"
            onChange={(e) => {
              handleDigitalChange("digital_file", e, 10);
            }}
          />
          {form.formState.errors.digital_file && (
            <p className="text-sm text-red-500">
              {String(form.formState.errors.digital_file?.message || "")}
            </p>
          )}

          {/* Digital File Display */}
          {(form.watch("digital_file_url") || form.watch("digital_file")) && (
            <div className="mt-2 flex items-center gap-2">
              <FileIcon className="h-5 w-5" />
              <div className="flex-1 min-w-0">
                <span className="text-sm truncate block">
                  {/* Show either new filename or existing URL */}
                  {form.getValues(`digital_file`)?.name ??
                    form.watch(`digital_file_url`)?.split("/").pop()}
                </span>
                {form.getValues(`digital_file`) && (
                  <span className="text-xs text-muted-foreground">
                    {(
                      form.getValues(`digital_file`)?.size /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    MB
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={async () => {
                  const thumbnailUrl = form.getValues("digital_file_url");
                  // If it's a real Supabase URL
                  if (thumbnailUrl && thumbnailUrl.startsWith("https://")) {
                    const deleted = await debouncedDelete(
                      thumbnailUrl!,
                      "products"
                    );
                    if (deleted) {
                      toast.success("Thumbnail deleted!");
                    } else {
                      toast.error("Failed to delete thumbnail");
                    }
                  }
                  // If it's a blob URL, revoke it
                  form.setValue("digital_file_url", null);
                  form.setValue("digital_file", null);
                  // Clear file input value
                  (
                    document.getElementById(
                      "main-digital-upload"
                    ) as HTMLInputElement
                  ).value = "";
                }}
              >
                <TrashIcon className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Status */}
      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <Controller
          name="status"
          control={form.control}
          defaultValue={initialData?.product.status || "draft"}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.status && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.status.message}
          </p>
        )}
      </div>

      {/* Variants Section */}
      <div className="space-y-6 mt-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Product Variants</h3>
          <Button
            type="button"
            onClick={() =>
              append({
                name: "",
                price: 0,
                currency: "USD",
                sku: undefined,
                stock_quantity: undefined,
                is_default: false,
                is_active: false,
                affiliate_url: undefined,
                thumbnail_url: undefined,
                digital_file_url: undefined,
                thumbnail_file: undefined,
                digital_file: undefined,
              })
            }
            className="gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Add Variant
          </Button>
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="p-5 border rounded-lg space-y-5 bg-muted/10 dark:bg-muted/20"
          >
            {/* Core Variant Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor={`variants.${index}.name`}>Variant Name*</Label>
                <Input
                  id={`variants.${index}.name`}
                  {...form.register(`variants.${index}.name`)}
                  placeholder="e.g., Large, Blue, Premium"
                />
                {form.formState.errors?.variants?.[index]?.name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.variants[index]?.name?.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor={`variants.${index}.price`}>Price*</Label>
                <Input
                  id={`variants.${index}.price`}
                  type="number"
                  step="0.01"
                  {...form.register(`variants.${index}.price`, {
                    valueAsNumber: true,
                  })}
                  placeholder="0.00"
                />
                {form.formState.errors?.variants?.[index]?.price && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.variants[index]?.price?.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor={`variants.${index}.currency`}>Currency</Label>
                <Controller
                  name={`variants.${index}.currency`}
                  control={form.control}
                  defaultValue={
                    initialData?.variants?.[index]?.currency || "USD"
                  }
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        {/* You can also use SelectValue for better accessibility */}
                        <SelectValue placeholder="Select Currency" />
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
                  )}
                />
                {form.formState.errors?.variants?.[index]?.currency && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors?.variants?.[index]?.currency.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor={`variants.${index}.sku`}>SKU</Label>
                <Input
                  id={`variants.${index}.sku`}
                  {...form.register(`variants.${index}.sku`)}
                  placeholder="e.g., PROD-001-LG"
                />
                {form.formState.errors?.variants?.[index]?.sku && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.variants[index]?.sku?.message}
                  </p>
                )}
              </div>

              {/* Stock Quantity */}
              {/* Only show if product type is physical or stock_quantity is defined */}
              {form.watch("type") === "physical" && (
                <div className="space-y-1">
                  <Label htmlFor={`variants.${index}.stock_quantity`}>
                    Stock
                  </Label>
                  <Input
                    id={`variants.${index}.stock_quantity`}
                    type="number"
                    {...form.register(`variants.${index}.stock_quantity`, {
                      valueAsNumber: true,
                    })}
                    placeholder="Available quantity"
                  />
                  {form.formState.errors?.variants?.[index]?.stock_quantity && (
                    <p className="text-sm text-red-500">
                      {
                        form.formState.errors.variants[index]?.stock_quantity
                          ?.message
                      }
                    </p>
                  )}
                </div>
              )}

              {/* Toggles */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Controller
                    control={control}
                    name={`variants.${index}.is_default`}
                    render={({ field }) => (
                      <Switch
                        id={`variants.${index}.is_default`}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />

                  <Label htmlFor={`variants.${index}.is_default`}>
                    Default Variant
                  </Label>
                  {form.formState.errors?.variants?.[index]?.is_default && (
                    <p className="text-sm text-red-500">
                      {
                        form.formState.errors.variants[index]?.is_default
                          ?.message
                      }
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Controller
                    control={control}
                    name={`variants.${index}.is_active`}
                    render={({ field }) => (
                      <Switch
                        id={`variants.${index}.is_active`}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <Label htmlFor={`variants.${index}.is_active`}>Active</Label>
                  {form.formState.errors?.variants?.[index]?.is_active && (
                    <p className="text-sm text-red-500">
                      {
                        form.formState.errors.variants[index]?.is_active
                          ?.message
                      }
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Variants Media Uploads Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Affiliate URL */}
              {(form.watch("type") === "affiliate" ||
                form.watch(`variants.${index}.affiliate_url`)) && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Affiliate URL
                  </label>
                  <Input
                    {...form.register(`variants.${index}.affiliate_url`)}
                    defaultValue={initialData?.product.affiliate_url || ""}
                    placeholder="Enter affiliate URL"
                    className="w-full"
                  />
                  {form.formState.errors.variants?.[index]?.affiliate_url && (
                    <p className="text-red-500 text-sm mt-1">
                      {
                        form.formState.errors.variants?.[index]?.affiliate_url
                          .message
                      }
                    </p>
                  )}
                </div>
              )}
              {/* Variant Image Column */}
              {(form.watch("type") === "physical" ||
                form.watch("type") === "affiliate") && (
                <div className="space-y-2">
                  <Label>Variant Image (Max 5MB)</Label>
                  <Input
                    id={`variant-thumbnail-${index}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleImageChange(`variants.${index}.thumbnail_file`, e)
                    }
                    className="cursor-pointer"
                  />
                  {form.formState.errors?.variants?.[index]?.thumbnail_file && (
                    <p className="text-sm text-red-500">
                      {String(
                        form.formState.errors.variants[index]?.thumbnail_file
                          ?.message || ""
                      )}
                    </p>
                  )}

                  {/* Thumbnail Preview Section */}
                  {(form.watch(`variants.${index}.thumbnail_url`) ||
                    form.getValues(`variants.${index}.thumbnail_file`)) && (
                    <div className="mt-2 flex items-center gap-2">
                      <img
                        src={form.watch(`variants.${index}.thumbnail_url`)!}
                        alt="Variant preview"
                        className="w-16 h-16 object-cover rounded border"
                      />
                      <div className="flex flex-col gap-1">
                        <span className="text-sm truncate block">
                          {form.getValues(`variants.${index}.thumbnail_file`)
                            ?.name ??
                            form
                              .watch(`variants.${index}.thumbnail_url`)
                              ?.split("/")
                              .pop()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(
                            form.getValues(`variants.${index}.thumbnail_file`)
                              ?.size /
                            1024 /
                            1024
                          ).toFixed(2)}{" "}
                          MB
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-fit"
                        onClick={async () => {
                          const thumbUrl = form.getValues(
                            `variants.${index}.thumbnail_url`
                          );
                          // If it's a real Supabase URL
                          if (thumbUrl && thumbUrl.startsWith("https://")) {
                            const deleted = await debouncedDelete(
                              thumbUrl!,
                              "products"
                            );
                            if (deleted) {
                              toast.success("Thumbnail deleted!");
                            } else {
                              toast.error("Failed to delete thumbnail");
                            }
                          }
                          if (thumbUrl?.startsWith("blob:")) {
                            URL.revokeObjectURL(thumbUrl);
                          }
                          form.setValue(`variants.${index}.thumbnail_url`, "");
                          form.setValue(
                            `variants.${index}.thumbnail_file`,
                            null
                          );
                          (
                            document.getElementById(
                              `variant-thumbnail-${index}`
                            ) as HTMLInputElement
                          ).value = "";
                        }}
                      >
                        <TrashIcon className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Digital Asset Column */}
              {form.watch("type") === "digital" && (
                <div className="space-y-2">
                  <Label>Digital Asset (Max 10MB)</Label>
                  <Input
                    id={`variant-digital-${index}`}
                    type="file"
                    accept=".pdf,.zip,.mp3,.mp4"
                    onChange={(e) =>
                      handleDigitalChange(
                        `variants.${index}.digital_file`,
                        e,
                        10
                      )
                    }
                    className="cursor-pointer"
                  />
                  {form.formState.errors?.variants?.[index]?.digital_file && (
                    <p className="text-sm text-red-500">
                      {String(
                        form.formState.errors.variants[index]?.digital_file
                          ?.message
                      )}
                    </p>
                  )}

                  {/* Digital File Display - NOW WITH VISIBLE TRASH ICON */}
                  {(form.watch(`variants.${index}.digital_file_url`) ||
                    form.watch(`variants.${index}.digital_file`)) && (
                    <div className="mt-2 flex items-center gap-2">
                      <FileIcon className="h-5 w-5" />
                      <div className="flex-1 min-w-0">
                        {" "}
                        {/* Added flex-1 and min-w-0 for text truncation */}
                        <span className="text-sm truncate block">
                          {form.getValues(`variants.${index}.digital_file`)
                            ?.name ??
                            form
                              .watch(`variants.${index}.digital_file_url`)
                              ?.split("/")
                              .pop()}
                        </span>
                        {form.getValues(`variants.${index}.digital_file`) && (
                          <span className="text-xs text-muted-foreground block">
                            {(
                              form.getValues(`variants.${index}.digital_file`)
                                ?.size /
                              1024 /
                              1024
                            ).toFixed(2)}{" "}
                            MB
                          </span>
                        )}
                      </div>
                      {/* DELETE BUTTON - NOW VISIBLE */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0" // Adjusted for square icon button
                        onClick={async () => {
                          const thumbnailUrl = form.getValues(
                            `variants.${index}.digital_file_url`
                          );
                          // If it's a real Supabase URL
                          if (
                            thumbnailUrl &&
                            thumbnailUrl.startsWith("https://")
                          ) {
                            const deleted = await debouncedDelete(
                              thumbnailUrl!,
                              "products"
                            );
                            if (deleted) {
                              toast.success("Thumbnail deleted!");
                            } else {
                              toast.error("Failed to delete thumbnail");
                            }
                          }
                          form.setValue(
                            `variants.${index}.digital_file_url`,
                            ""
                          );
                          form.setValue(`variants.${index}.digital_file`, null);
                          (
                            document.getElementById(
                              `variant-digital-${index}`
                            ) as HTMLInputElement
                          ).value = "";
                        }}
                      >
                        <TrashIcon className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              key={`remove-${field.id}`}
              disabled={removingIndex}
              onClick={() => handleRemoveVariant(index)}
              className="mt-2"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Remove Variant
            </Button>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-900 transition"
      >
        {isLoading
          ? "Saving..."
          : initialData
            ? "Update Product"
            : "Create Product"}
      </button>
    </form>
  );
}
