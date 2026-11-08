import type { Listing } from "@/lib/data";
import { getSupabase } from "@/lib/supabase";

type ListingRow = {
  id: string;
  title: string;
  description: string;
  condition: string;
  price: number | string;
  city: string;
  published_at: string | null;
  seller_display_name: string;
  categories: { name: string } | { name: string }[] | null;
  listing_images: { object_path: string; sort_order: number }[] | null;
};

const fallbackImage = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85";

function categoryName(value: ListingRow["categories"]) {
  return Array.isArray(value) ? value[0]?.name ?? "Diğer" : value?.name ?? "Diğer";
}

function postedAt(value: string | null) {
  if (!value) return "Yeni";
  const elapsed = Date.now() - new Date(value).getTime();
  const hours = Math.max(0, Math.floor(elapsed / 3_600_000));
  if (hours < 1) return "Az önce";
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Dün" : `${days} gün önce`;
}

async function mapListing(row: ListingRow): Promise<Listing> {
  const supabase = getSupabase();
  const imagePath = [...(row.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.object_path;
  let image = fallbackImage;
  if (supabase && imagePath) {
    const { data } = await supabase.storage.from("listing-images").createSignedUrl(imagePath, 3_600);
    if (data?.signedUrl) image = data.signedUrl;
  }
  return {
    id: row.id,
    amount: Number(row.price),
    title: row.title,
    description: row.description,
    condition: row.condition,
    price: `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(Number(row.price))} TL`,
    location: row.city,
    category: categoryName(row.categories),
    posted: postedAt(row.published_at),
    image,
    sellerName: row.seller_display_name,
    href: `/ilan-detay/?id=${encodeURIComponent(row.id)}`,
  };
}

const listingSelect = "id,title,description,condition,price,city,published_at,seller_display_name,categories(name),listing_images(object_path,sort_order)";

export async function fetchPublishedListings() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase bağlantısı kurulamadı.");
  const { data, error } = await supabase.from("listings").select(listingSelect).eq("status", "published").order("published_at", { ascending: false });
  if (error) throw error;
  return Promise.all(((data ?? []) as unknown as ListingRow[]).map(mapListing));
}

export async function fetchPublishedListing(id: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase bağlantısı kurulamadı.");
  const { data, error } = await supabase.from("listings").select(listingSelect).eq("id", id).eq("status", "published").single();
  if (error) throw error;
  return mapListing(data as unknown as ListingRow);
}
