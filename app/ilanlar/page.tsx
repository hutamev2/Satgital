"use client";

import Link from "next/link";
import { Filter, LayoutGrid, List, Plus, Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ListingCard } from "@/components/ListingCard";
import { categoryTree } from "@/lib/market-categories";
import type { Listing } from "@/lib/data";
import { fetchPublishedListings } from "@/lib/live-listings";

const conditionOptions = ["Yeni gibi", "Çok iyi", "İyi", "Kullanılmış"];

function listingPrice(item: Listing) {
  return item.amount ?? Number(item.price.split(" ")[0].replaceAll(".", "").replace(",", "."));
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [params, setParams] = useState<URLSearchParams>();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("new");

  const get = (key: string) => params?.get(key) ?? "";
  const activeFilterCount = ["category", "city", "min", "max", "condition", "days"].filter((key) => get(key)).length;

  useEffect(() => {
    setParams(new URLSearchParams(window.location.search));
    fetchPublishedListings()
      .then(setListings)
      .catch((error) => setLoadError(error instanceof Error ? error.message : "İlanlar yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [filtersOpen]);

  const visibleListings = useMemo(() => {
    const query = get("q").trim().toLocaleLowerCase("tr");
    const group = categoryTree.find((item) => item.label === get("category"));
    const rows = listings.filter((item) => {
      const searchable = [item.title, item.description, item.category, item.location].join(" ").toLocaleLowerCase("tr");
      const price = listingPrice(item);
      return searchable.includes(query)
        && (!get("category") || item.category === get("category") || group?.children.includes(item.category))
        && (!get("city") || item.location.split(",")[0] === get("city"))
        && (!get("condition") || item.condition === get("condition"))
        && (!get("days") || Boolean(item.publishedAt && Date.parse(item.publishedAt) >= Date.now() - Number(get("days")) * 86_400_000))
        && (!get("min") || price >= Number(get("min")))
        && (!get("max") || price <= Number(get("max")));
    });
    if (sort === "asc") return rows.sort((a, b) => listingPrice(a) - listingPrice(b));
    if (sort === "desc") return rows.sort((a, b) => listingPrice(b) - listingPrice(a));
    return rows;
  }, [listings, params, sort]);

  const cities = Array.from(new Set([...listings.map((item) => item.location.split(",")[0]), get("city")].filter(Boolean))).sort();
  const categories = Array.from(new Set([...categoryTree.map((item) => item.label), ...listings.map((item) => item.category), get("category")].filter(Boolean)));

  return (
    <main className="catalog-page">
      <section className="catalog-hero">
        <div className="container">
          <div><span>İlanları keşfet</span><h1>Aradığın ürün burada olabilir.</h1><p>İlanları ara, filtrele ve sana en uygun seçeneği bul.</p></div>
          {params && <form className="catalog-main-search" action="/ilanlar/">
            <Search aria-hidden="true" />
            <input name="q" defaultValue={get("q")} aria-label="İlanlarda ara" placeholder="Ne arıyorsun?" />
            <button type="submit">Ara</button>
          </form>}
        </div>
      </section>

      <div className="container catalog-workspace">
        <form id="catalog-filter" action="/ilanlar/" method="get">
          <input type="hidden" name="q" value={get("q")} readOnly />
        </form>

        <button className="mobile-filter-trigger" type="button" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal /> Filtrele {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
        </button>
        {filtersOpen && <button className="filter-backdrop" type="button" aria-label="Filtreleri kapat" onClick={() => setFiltersOpen(false)} />}

        <aside className={`catalog-filters ${filtersOpen ? "is-open" : ""}`} aria-label="İlan filtreleri">
          <header><div><Filter /><strong>Filtreler</strong>{activeFilterCount > 0 && <span>{activeFilterCount}</span>}</div><button type="button" aria-label="Filtreleri kapat" onClick={() => setFiltersOpen(false)}><X /></button></header>
          <label>Kategori<select form="catalog-filter" name="category" defaultValue={get("category")}><option value="">Tüm kategoriler</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Konum<select form="catalog-filter" name="city" defaultValue={get("city")}><option value="">Tüm Türkiye</option>{cities.map((item) => <option key={item}>{item}</option>)}</select></label>
          <fieldset><legend>Fiyat aralığı</legend><div className="filter-price-row"><input form="catalog-filter" name="min" type="number" min="0" defaultValue={get("min")} aria-label="En düşük fiyat" placeholder="En az" /><input form="catalog-filter" name="max" type="number" min="0" defaultValue={get("max")} aria-label="En yüksek fiyat" placeholder="En çok" /></div></fieldset>
          <label>Ürün durumu<select form="catalog-filter" name="condition" defaultValue={get("condition")}><option value="">Tümü</option>{conditionOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Yayın tarihi<select form="catalog-filter" name="days" defaultValue={get("days")}><option value="">Tüm zamanlar</option><option value="1">Son 24 saat</option><option value="7">Son 7 gün</option><option value="30">Son 30 gün</option></select></label>
          <div className="filter-actions"><button form="catalog-filter" className="primary-button">Sonuçları göster</button><Link href="/ilanlar/">Filtreleri temizle</Link></div>
        </aside>

        <section className="catalog-results" aria-live="polite">
          <div className="catalog-results-bar">
            <div><strong>{loading ? "İlanlar yükleniyor" : `${visibleListings.length} ilan bulundu`}</strong>{get("q") && <span>“{get("q")}” araması</span>}</div>
            <div className="catalog-controls">
              <div className="view-toggle" aria-label="Görünüm seçimi"><button type="button" aria-label="Grid görünümü" aria-pressed={view === "grid"} onClick={() => setView("grid")}><LayoutGrid /></button><button type="button" aria-label="Liste görünümü" aria-pressed={view === "list"} onClick={() => setView("list")}><List /></button></div>
              <select aria-label="İlanları sırala" value={sort} onChange={(event) => setSort(event.target.value)}><option value="new">En yeni</option><option value="asc">Fiyat artan</option><option value="desc">Fiyat azalan</option></select>
            </div>
          </div>

          {loadError && <div className="catalog-error" role="alert"><strong>İlanlar yüklenemedi</strong><p>{loadError}</p><button onClick={() => location.reload()}>Tekrar dene</button></div>}
          {loading && <div className="catalog-skeleton" aria-label="İlanlar yükleniyor">{Array.from({ length: 6 }, (_, index) => <span key={index} />)}</div>}
          {!loading && !loadError && visibleListings.length === 0 && <div className="catalog-empty"><span><SearchX /></span><h2>Bu aramaya uygun ilan yok</h2><p>Filtreleri değiştirebilir veya aradığın ürünü ilk sen listeleyebilirsin.</p><div><Link className="primary-button" href="/ilan-ver/"><Plus /> Ücretsiz ilan ver</Link><Link href="/ilanlar/">Filtreleri temizle</Link></div></div>}
          {!loading && !loadError && <div className={`redesign-listing-grid ${view === "list" ? "is-list" : ""}`}>{visibleListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>}
        </section>
      </div>
    </main>
  );
}
