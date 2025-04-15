import { ProductForm } from "@/components/store/ProductForm";
import { getCurrencyOptions } from "@/lib/utils";

export default async function NewProductPage() {
  const currencyOptions = getCurrencyOptions(); // Call the function to get the options array

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">New Product</h1>
        <ProductForm
          onSubmit={{ update: false, id: undefined }}
          currencyOptions={currencyOptions}
        />
      </div>
    </div>
  );
}
