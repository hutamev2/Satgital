"use client";

import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ListingCard } from "@/components/ListingCard";
import { categories, listings as demoListings, type Listing } from "@/lib/data";
import { fetchPublishedListings } from "@/lib/live-listings";

export default function ListingsPage() {
  const [liveListings, setLiveListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const listings = useMemo(() => [...liveListings, ...demoListings], [liveListings]);

  useEffect(() => {
    fetchPublishedListings()
      .then(setLiveListings)
      .catch((error) => setLoadError(error instanceof Error ? error.message : "İlanlar yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="page-shell">
      <div className="container">
        <div className="page-intro"><span className="section-kicker">Keşfet</span><h1>Tüm ilanlar</h1><p>İhtiyacın olan ürünü binlerce seçenek arasından bul.</p></div>
        <div className="catalog-toolbar">
          <div className="catalog-search"><Search size={20} /><input placeholder="İlanlarda ara" aria-label="İlanlarda ara" /><button>Ara</button></div>
          <button className="filter-mobile"><SlidersHorizontal size={19} /> Filtreler</button>
        </div>
        <div className="catalog-layout">
          <aside className="filter-panel">
            <h2><Filter size={18} /> Filtrele</h2>
            <label>Kategori<select defaultValue=""><option value="">Tüm kategoriler</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Konum<select defaultValue=""><option value="">Tüm Türkiye</option><option>İstanbul</option><option>Ankara</option><option>İzmir</option></select></label>
            <label>Fiyat aralığı<div className="price-inputs"><input placeholder="En az" /><input placeholder="En çok" /></div></label>
            <label>Ürün durumu<select defaultValue=""><option value="">Tümü</option><option>Yeni gibi</option><option>Çok iyi</option><option>İyi</option></select></label>
            <button className="primary-button full-button">Sonuçları göster</button>
          </aside>
          <section className="catalog-results">
            <div className="result-bar"><strong>{loading ? "İlanlar yükleniyor..." : `${listings.length} ilan`}</strong><select aria-label="Sıralama"><option>En yeni</option><option>Fiyat: düşükten yükseğe</option><option>Fiyat: yüksekten düşüğe</option></select></div>
            {loadError && <p className="upload-error" role="alert">Canlı ilanlar yüklenemedi: {loadError}</p>}
            <div className="listing-grid catalog-grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
          </section>
        </div>
      </div>
    </main>
  );
}
