export interface Review {
  id: string;
  writer: string;
  rating: number;
  date: string;
  text: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  description: string;
  longDescription: string;
  image: string;
  images?: string[];
  rating: number;
  reviewsCount: number;
  category: string;
  features: string[];
  variants?: string[];
  sizes?: string[];
  variantImages?: Record<string, string>;
  stock: number;
  badge?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface Order {
  id: string;
  customerDetails: {
    name: string;
    phone: string;
    whatsapp: string;
    address: string;
    city: string;
    notes?: string;
  };
  items: CartItem[];
  totalAmount: number;
  shippingCost: number;
  date: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentMethod: string;
}

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  priceText: string;
  badge: string;
  tagline: string;
  image: string;
  linkCategory: string;
  bgColor?: string;
}

export interface LayoutConfig {
  showSlider: boolean;
  showCategories: boolean;
  showFlashSale: boolean;
  showTrending: boolean;
  showReviews: boolean;
  showInquiry: boolean;
  showFooter: boolean;
}

export interface FileMetadata {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  category: "image" | "audio" | "video" | "document" | "other";
  notes?: string;
  uploadedAt: string;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  categories: {
    image: number;
    audio: number;
    video: number;
    document: number;
    other: number;
  };
}


