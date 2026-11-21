"use client";

import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { ListingCard } from "@/components/ListingCard";
import { categoryTree } from "@/lib/market-categories";
import { type Listing } from "@/lib/data";
import { fetchPublishedListings } from "@/lib/live-listings";

export default function ListingsPage() {
  const [listings, setLiveListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [params, setParams] = useState<URLSearchParams | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sort, setSort] = useState("new");
  const get = (key: string) => params?.get(key) ?? "";
  const group = categoryTree.find(item => item.label === get("category"));
  const query = get("q").trim().toLocaleLowerCase("tr");
  const priceOf = (item: Listing) => item.amount ?? Number(item.price.split(" ")[0].replaceAll(".", "").replace(",", "."));
  const visible = listings.filter(item => {
    const searchable = [item.title, item.description, item.category].join(" ").toLocaleLowerCase("tr");
    const price = priceOf(item);
    return searchable.includes(query)
      && (!get("category") || item.category === get("category") || group?.children.includes(item.category))
      && (!get("city") || item.location.split(",")[0] === get("city"))
      && (!get("condition") || item.condition === get("condition"))
      && (!get("min") || price >= Number(get("min")))
      && (!get("max") || price <= Number(get("max")));
  });
  if (sort !== "new") visible.sort((a, b) => sort === "asc" ? priceOf(a) - priceOf(b) : priceOf(b) - priceOf(a));
  useEffect(() => {
    setParams(new URLSearchParams(window.location.search));
    fetchPublishedListings()
      .then(setLiveListings)
      .catch((error) => setLoadError(error instanceof Error ? error.message : "İlanlar yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="page-shell">
      <div className="container">
        <div className="page-intro"><span className="section-kicker">Keşfet</span><h1>Tüm ilanlar</h1><p>İhtiyacın olan ürünü binlerce seçenek arasından bul.</p></div>
        <form id="catalog-filter" action="/ilanlar/" method="get" />
        {params && <div className="catalog-toolbar">
          <div className="catalog-search"><Search size={20} /><input form="catalog-filter" name="q" defaultValue={get("q")} placeholder="İlanlarda ara" aria-label="İlanlarda ara" /><button form="catalog-filter">Ara</button></div>
          <button className="filter-mobile" aria-expanded={mobileOpen} aria-controls="filters" onClick={() => setMobileOpen(!mobileOpen)}><SlidersHorizontal size={19} /> Filtreler</button>
        </div>}
        <div className="catalog-layout">
          {params && <aside id="filters" className="filter-panel" style={mobileOpen ? { display: "grid", position: "static" } : undefined}>
            <h2><Filter size={18} /> Filtrele</h2>
            <label>Kategori<select form="catalog-filter" name="category" defaultValue={get("category")}><option value="">Tüm kategoriler</option>{Array.from(new Set([...categoryTree.map(item => item.label), ...listings.map(item => item.category), get("category")].filter(Boolean))).map(item => <option key={item}>{item}</option>)}</select></label>
            <label>Konum<select form="catalog-filter" name="city" defaultValue={get("city")}><option value="">Tüm Türkiye</option>{Array.from(new Set([...listings.map(item => item.location.split(",")[0]), get("city")].filter(Boolean))).map(item => <option key={item}>{item}</option>)}</select></label>
            <div>Fiyat aralığı<div className="price-inputs">{(["min", "max"] as const).map((key, index) => <input key={key} form="catalog-filter" name={key} type="number" min="0" step="0.01" defaultValue={get(key)} aria-label={index ? "En yüksek fiyat" : "En düşük fiyat"} placeholder={index ? "En çok" : "En az"} />)}</div></div>
            <label>Ürün durumu<select form="catalog-filter" name="condition" defaultValue={get("condition")}><option value="">Tümü</option>{Array.from(new Set([...listings.map(item => item.condition), get("condition")].filter(Boolean))).map(item => <option key={item}>{item}</option>)}</select></label>
            <button form="catalog-filter" className="primary-button full-button">Sonuçları göster</button>
          </aside>}
          <section className="catalog-results">
            <div className="result-bar"><strong>{loading ? "İlanlar yükleniyor..." : `${visible.length} ilan`}</strong><select aria-label="Sıralama" value={sort} onChange={event => setSort(event.target.value)}><option value="new">En yeni</option><option value="asc">Fiyat: düşükten yükseğe</option><option value="desc">Fiyat: yüksekten düşüğe</option></select></div>
            {loadError && <p className="upload-error" role="alert">Canlı ilanlar yüklenemedi: {loadError}</p>}
            {!loading && !loadError && !visible.length && <p>Bu filtrelerle eşleşen ilan bulunamadı. <a href="/ilanlar/">Filtreleri temizle</a></p>}
            <div className="listing-grid catalog-grid">{visible.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
          </section>
        </div>
      </div>
    </main>
  );
}
