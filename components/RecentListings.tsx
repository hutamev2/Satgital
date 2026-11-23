"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PackageSearch, Plus } from "lucide-react";
import { ListingCard } from "@/components/ListingCard";
import type { Listing } from "@/lib/data";
import { fetchPublishedListings } from "@/lib/live-listings";

export function RecentListings() {
  const [items, setItems] = useState<Listing[]>();
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    fetchPublishedListings(6).then(rows => {
      if (active) setItems(rows);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);
  if (error) return <div className="home-empty" role="status"><span><PackageSearch /></span><h3>İlanlara şu anda ulaşamıyoruz</h3><p>Kısa süre sonra yeniden deneyebilirsin.</p></div>;
  if (!items) return <div className="catalog-skeleton" aria-label="İlanlar yükleniyor">{Array.from({ length: 3 }, (_, index) => <span key={index} />)}</div>;
  if (!items.length) return <div className="home-empty"><span><PackageSearch /></span><h3>İlk ilan seninki olabilir</h3><p>Kullanmadığın ürünü birkaç adımda ücretsiz yayınla.</p><Link className="primary-button" href="/ilan-ver/"><Plus /> Ücretsiz ilan ver</Link></div>;
  return <div className="listing-grid">{items.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>;
}
