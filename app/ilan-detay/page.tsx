"use client";

import {FavoriteButton} from "@/components/FavoriteButton";
import { BuyButton } from "@/components/BuyButton";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Heart, MapPin, MessageCircle, Share2, ShieldCheck, UserRound } from "lucide-react";
import type { Listing } from "@/lib/data";
import { fetchPublishedListing } from "@/lib/live-listings";

export default function LiveListingDetail() {
  const [listing, setListing] = useState<Listing | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) { setError("İlan kimliği bulunamadı."); return; }
    fetchPublishedListing(id).then(setListing).catch(() => setError("İlan bulunamadı veya yayından kaldırıldı."));
  }, []);

  if (error) return <main className="page-shell"><div className="container"><Link className="back-link" href="/ilanlar"><ArrowLeft size={17} /> İlanlara dön</Link><p className="upload-error">{error}</p></div></main>;
  if (!listing) return <main className="page-shell"><div className="container"><p>İlan yükleniyor...</p></div></main>;

  return (
    <main className="page-shell detail-page"><div className="container">
      <Link className="back-link" href="/ilanlar"><ArrowLeft size={17} /> İlanlara dön</Link>
      <div className="detail-layout"><section>
        <div className="detail-image"><img src={listing.image} alt={listing.title} /><FavoriteButton id={listing.id}/></div>
        <div className="detail-info-card"><div className="detail-title-row"><div><span className="listing-category">{listing.category}</span><h1>{listing.title}</h1></div><div className="detail-actions"><button aria-label="Paylaş"><Share2 /></button></div></div>
          <div className="detail-meta"><span><MapPin /> {listing.location}</span><span><CalendarDays /> {listing.posted}</span></div>
          <hr /><h2>Açıklama</h2><p>{listing.description}</p>
          <div className="spec-grid"><div><span>Ürün durumu</span><strong>{listing.condition}</strong></div><div><span>Kategori</span><strong>{listing.category}</strong></div><div><span>Teslimat</span><strong>Elden teslim</strong></div></div>
        </div>
      </section><aside className="seller-card"><span className="detail-price">{listing.price}</span><div className="seller-profile"><div className="seller-avatar"><UserRound /></div><div><strong>{listing.sellerName ?? "Satgital Kullanıcısı"}</strong><span>Doğrulanmış ilan</span></div></div><BuyButton listing={listing}/><button className="primary-button full-button"><MessageCircle size={19} /> Satıcıya mesaj gönder</button><div className="safe-note"><ShieldCheck /><p><strong>Güvenli alışveriş</strong>Kapora göndermeden önce ürünü ve satıcıyı doğrula.</p></div></aside></div>
    </div></main>
  );
}
