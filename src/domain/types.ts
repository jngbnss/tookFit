// Domain types. Mock services implement these shapes so real APIs can replace them later.

export type CategorySlug =
  | 'outerwear'
  | 'knitwear'
  | 'tops'
  | 'bottoms'
  | 'sets'
  | 'shoes'
  | 'bags'
  | 'accessories';

export type CollectionSlug = CategorySlug | 'new-arrivals' | 'best-sellers' | 'sale' | 'all';

export type Badge = 'NEW' | 'BEST' | 'LIMITED' | 'SALE';

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

export interface ProductImage {
  src: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  description: string;
  price: number;
  originalPrice?: number;
  badge?: Badge;
  colors: ColorOption[];
  sizes: string[];
  /** stock[colorId][size] = units available */
  stock: Record<string, Record<string, number>>;
  material: string;
  fit: string;
  care: string[];
  shipping: string;
  images: ProductImage[];
  relatedIds: string[];
  createdAt: string;
  featuredRank: number;
}

export interface CartItem {
  key: string;
  productId: string;
  colorId: string;
  size: string;
  quantity: number;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  itemCount: number;
  freeShippingRemaining: number;
}

export type PaymentMethod = 'card' | 'kakaopay' | 'naverpay';

export interface ShippingDetails {
  fullName: string;
  email: string;
  phone: string;
  postalCode: string;
  address: string;
  city: string;
  note: string;
}

export interface OrderLine {
  productId: string;
  name: string;
  image: string;
  colorName: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus = 'Processing' | 'Preparing shipment' | 'Shipped' | 'Delivered';

/** Non-sensitive order snapshot. Never contains card data. */
export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  lines: OrderLine[];
  totals: CartTotals;
  coupon: string | null;
  shipping: ShippingDetails;
  payment: { method: PaymentMethod; label: string; last4?: string };
}

export interface User {
  name: string;
  email: string;
}

export interface CatalogQuery {
  q: string;
  collection: CollectionSlug;
  categories: CategorySlug[];
  sizes: string[];
  colors: string[];
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
  sort: SortKey;
}

export type SortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc';
