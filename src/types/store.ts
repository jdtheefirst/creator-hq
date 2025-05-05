export type ProductType = "physical" | "digital" | "affiliate";
export type ProductStatus = "draft" | "published";
export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled";

export interface Product {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  type: ProductType;
  status: ProductStatus;
  variants_count: number | 0;
  is_active: boolean | null;
  is_default: boolean | null;
  weight: number | null;
  sku: string | null;
  thumbnail_url: string | null;
  affiliate_url: string | null;
  digital_file_url: string | null;
  stock_quantity: number | null;
  sales_count: number | null;
  rating: number | null;
  review_count: number | null;
  created_at: string;
  updated_at: string;
  purchasable_type: string | null;
  purchasable_id: string | null;
  variants?: ProductVariant[];
  featured: boolean | null;
}

export interface ProductFormData {
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  type: ProductType;
  status: ProductStatus;
  stock_quantity?: number;
  affiliate_url?: string | null;
  thumbnail_url?: string | null;
  digital_file_url?: string | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  currency: string;
  sku: string | null;
  stock_quantity: number | null;
  is_default: boolean;
  thumbnail_url: string | null;
  digital_file_url: string | null;
  affiliate_url: string | null;
  is_active: boolean;
  weight: number | null;
  weight_unit: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  metadata: Record<string, string> | null;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  creator_id: string;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  stripe_session_id: string | null;
  shipping_address: ShippingAddress | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  currency: string;
  created_at: string;
}

export interface ShippingAddress {
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}
