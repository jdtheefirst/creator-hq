import { ProductForm } from "@/components/store/ProductForm";
export default async function NewProductPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">New Product</h1>
        <ProductForm onSubmit={{ update: false, id: undefined }} />
      </div>
    </div>
  );
}
