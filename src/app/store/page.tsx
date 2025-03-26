import Image from "next/image";
import Link from "next/link";

// Temporary product data
const products = [
  {
    id: 1,
    name: "Digital Art Print",
    price: 29.99,
    image: "/placeholder-product.jpg",
    category: "Digital",
  },
  {
    id: 2,
    name: "Premium Tutorial",
    price: 49.99,
    image: "/placeholder-product.jpg",
    category: "Digital",
  },
  {
    id: 3,
    name: "Merch T-Shirt",
    price: 24.99,
    image: "/placeholder-product.jpg",
    category: "Physical",
  },
];

export default function StorePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-12">Store</h1>

        {/* Categories */}
        <div className="flex justify-center gap-4 mb-8">
          {["All", "Digital", "Physical"].map((category) => (
            <button
              key={category}
              className="px-4 py-2 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {category}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-2">{product.category}</p>
                <p className="text-2xl font-bold text-blue-600 mb-4">
                  ${product.price}
                </p>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
