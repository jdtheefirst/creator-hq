import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Product, ProductType } from "@/types/store";
import { getCurrencyOptions } from "@/lib/utils";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be positive"),
  currency: z.string().min(1, "Currency is required"),
  type: z.enum(["physical", "digital", "affiliate"]),
  status: z.enum(["draft", "published", "archived"]),
  stock_quantity: z.number().optional(),
  affiliate_url: z.string().url().optional().nullable(),
});

interface ProductFormProps {
  initialData?: Product;
  onSubmit: (data: z.infer<typeof productSchema>) => Promise<void>;
}

export function ProductForm({ initialData, onSubmit }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const currencyOptions = getCurrencyOptions();

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
          price: 0,
          currency: "USD",
          type: "physical" as ProductType,
          status: "draft",
          stock_quantity: undefined,
          affiliate_url: undefined,
        },
  });

  const handleSubmit = async (data: z.infer<typeof productSchema>) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
    } catch (error) {
      console.error("Error submitting product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-4">
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

        <div>
          <label className="block text-sm font-medium mb-1">Currency</label>
          <select
            {...form.register("currency", { valueAsNumber: true })}
            className="w-full border rounded-md p-2"
          >
            {currencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {form.formState.errors.currency && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.currency.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Product Type</label>
          <Select
            {...form.register("type")}
            defaultValue={initialData?.type || "physical"}
          >
            <option value="physical">Physical Product</option>
            <option value="digital">Digital Product</option>
            <option value="affiliate">Affiliate Product</option>
          </Select>
        </div>

        {form.watch("type") === "physical" && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Stock Quantity
            </label>
            <Input
              type="number"
              {...form.register("stock_quantity", { valueAsNumber: true })}
              placeholder="Enter stock quantity"
              className="w-full"
            />
          </div>
        )}

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
        </div>

        {form.watch("type") === "digital" && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Digital File
            </label>
            <Input
              type="file"
              onChange={(e) => setDigitalFile(e.target.files?.[0] || null)}
              className="w-full"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <Select
            {...form.register("status")}
            defaultValue={initialData?.status || "draft"}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
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
