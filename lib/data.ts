export type Listing = {
  id: string;
  title: string;
  price: string;
  amount?: number;
  location: string;
  category: string;
  condition: string;
  posted: string;
  image: string;
  images?: string[];
  publishedAt?: string | null;
  description: string;
  sellerName?: string;
  sellerId?: string;
  href: string;
};
