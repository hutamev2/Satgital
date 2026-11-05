import Link from "next/link";
import { ArrowLeft, CalendarDays, Heart, MapPin, MessageCircle, Share2, ShieldCheck, UserRound } from "lucide-react";
import { listings } from "@/lib/data";
import { notFound } from "next/navigation";

export function generateStaticParams() { return listings.map(({ id }) => ({ id })); }

export default async function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = listings.find((item) => item.id === id);
  if (!listing) notFound();
  return (
    <main className="page-shell detail-page">
      <div className="container">
        <Link className="back-link" href="/ilanlar"><ArrowLeft size={17} /> İlanlara dön</Link>
        <div className="detail-layout">
          <section>
            <div className="detail-image"><img src={listing.image} alt={listing.title} /><button><Heart /> Favoriye ekle</button></div>
            <div className="detail-info-card"><div className="detail-title-row"><div><span className="listing-category">{listing.category}</span><h1>{listing.title}</h1></div><div className="detail-actions"><button aria-label="Paylaş"><Share2 /></button><button aria-label="Favorilere ekle"><Heart /></button></div></div>
              <div className="detail-meta"><span><MapPin /> {listing.location}</span><span><CalendarDays /> {listing.posted}</span></div>
              <hr /><h2>Açıklama</h2><p>{listing.description}</p>
              <div className="spec-grid"><div><span>Ürün durumu</span><strong>{listing.condition}</strong></div><div><span>Kategori</span><strong>{listing.category}</strong></div><div><span>Teslimat</span><strong>Elden teslim</strong></div></div>
            </div>
          </section>
          <aside className="seller-card"><span className="detail-price">{listing.price}</span><div className="seller-profile"><div className="seller-avatar"><UserRound /></div><div><strong>Deniz K.</strong><span>2024'ten beri üye</span></div></div><button className="primary-button full-button"><MessageCircle size={19} /> Satıcıya mesaj gönder</button><button className="secondary-button full-button">Telefon numarasını göster</button><div className="safe-note"><ShieldCheck /><p><strong>Güvenli alışveriş</strong>Kapora göndermeden önce ürünü ve satıcıyı doğrula.</p></div></aside>
        </div>
      </div>
    </main>
  );
}
