"use client";

import { useEffect, useState } from "react";
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
  if (error) return <p role="status">Son ilanlar şu anda yüklenemiyor.</p>;
  if (!items) return <p role="status">İlanlar yükleniyor…</p>;
  if (!items.length) return <p>Henüz yayında ilan yok.</p>;
  return <div className="listing-grid">{items.map(listing => <ListingCard key={listing.id} listing={listing} />)}</div>;
}
