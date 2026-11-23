"use client";

import { ListingCard } from "@/components/ListingCard";
import {FavoriteButton} from "@/components/FavoriteButton";
import { BuyButton } from "@/components/BuyButton";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, MapPin, MessageCircle, Share2, ShieldCheck, UserRound } from "lucide-react";
import type { Listing } from "@/lib/data";
import { fetchPublishedListing, fetchPublishedListings } from "@/lib/live-listings";

export default function LiveListingDetail() {
  const [listing, setListing] = useState<Listing | null>(null);
  const [photo, setPhoto] = useState(0);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [shareMessage, setShareMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) { setError("İlan kimliği bulunamadı."); return; }
    fetchPublishedListing(id).then(item => {
      setListing(item);
      void fetchPublishedListings(100).then(rows => setSimilar(rows.filter(row => row.id !== item.id && row.category === item.category).slice(0,4))).catch(() => {});
    }).catch(() => setError("İlan bulunamadı veya yayından kaldırıldı."));
  }, []);

  if (error) return <main className="page-shell"><div className="container"><Link className="back-link" href="/ilanlar"><ArrowLeft size={17} /> İlanlara dön</Link><p className="upload-error">{error}</p></div></main>;
  if (!listing) return <main className="page-shell"><div className="container"><p>İlan yükleniyor...</p></div></main>;

  const gallery = listing.images?.length ? listing.images : [listing.image];

  return (
    <main className="redesign-detail-page">
      <div className="container">
        <nav className="detail-breadcrumb" aria-label="Sayfa yolu"><Link href="/ilanlar/"><ArrowLeft /> İlanlar</Link><span>/</span><Link href={`/ilanlar/?category=${encodeURIComponent(listing.category)}`}>{listing.category}</Link></nav>
        <div className="redesign-detail-layout">
          <section className="detail-main-column">
            <div className="detail-gallery">
              <div className="detail-gallery-main"><img src={gallery[photo]} alt={`${listing.title} fotoğrafı`} /><FavoriteButton id={listing.id} /><span>{photo + 1} / {gallery.length}</span></div>
              {gallery.length > 1 && <div className="detail-gallery-thumbs">{gallery.map((image, index) => <button key={image} aria-label={`${index + 1}. fotoğrafı göster`} aria-pressed={photo === index} onClick={() => setPhoto(index)}><img src={image} alt="" /></button>)}</div>}
            </div>

            <article className="redesign-detail-info">
              <div className="detail-title-row"><div><span className="listing-category">{listing.category}</span><h1>{listing.title}</h1></div><button className="detail-share" aria-label="İlanı paylaş" onClick={async () => { try { await navigator.clipboard.writeText(location.href); setShareMessage("İlan bağlantısı kopyalandı."); } catch { setShareMessage("Bağlantıyı adres çubuğundan kopyalayabilirsin."); } }}><Share2 /></button></div>
              <div className="detail-meta"><span><MapPin /> {listing.location}</span><span><CalendarDays /> {listing.posted}</span></div>
              {shareMessage && <p className="share-status" role="status">{shareMessage}</p>}
              <div className="detail-description"><h2>İlan açıklaması</h2><p>{listing.description}</p></div>
              <div className="redesign-specs"><div><span>Ürün durumu</span><strong>{listing.condition}</strong></div><div><span>Kategori</span><strong>{listing.category}</strong></div><div><span>Teslimat</span><strong>Elden teslim</strong></div></div>
            </article>
          </section>

          <aside className="redesign-seller-card">
            <span className="detail-price-label">Satış fiyatı</span><strong className="detail-price">{listing.price}</strong>
            <div className="seller-profile"><div className="seller-avatar"><UserRound /></div><div><strong>{listing.sellerName ?? "Satgital Kullanıcısı"}</strong><span>İlan sahibi</span></div></div>
            <div className="detail-cta-stack"><BuyButton listing={listing} /><Link className="primary-button full-button" href={`/mesajlar/?ilan=${encodeURIComponent(listing.id)}`}><MessageCircle /> Satıcıya mesaj gönder</Link></div>
            <div className="safe-note"><ShieldCheck /><p><strong>Güvenli alışveriş</strong>Ürünü görmeden ödeme yapma. Görüşmeleri Satgital içinde sürdür.</p></div>
          </aside>
        </div>
        {similar.length > 0 && <section className="redesign-similar"><div><span>Benzer seçenekler</span><h2>Bunlar da ilgini çekebilir</h2></div><div className="redesign-listing-grid">{similar.map((item) => <ListingCard key={item.id} listing={item} />)}</div></section>}
      </div>
    </main>
  );
}
