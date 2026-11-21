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
  description: string;
  sellerName?: string;
  sellerId?: string;
  href: string;
};
