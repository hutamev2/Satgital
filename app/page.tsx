import Link from "next/link";
import { ArrowRight, Bike, BookOpen, Car, Dumbbell, Grid3X3, Laptop, Search, ShieldCheck, Shirt, Smartphone, Sofa, Sparkles, UsersRound, Zap } from "lucide-react";
import { ListingCard } from "@/components/ListingCard";
import { listings } from "@/lib/data";

const categoryItems = [
  [Sofa, "Mobilya & Ev"], [Laptop, "Elektronik"], [Smartphone, "Telefon"], [Shirt, "Giyim"],
  [BookOpen, "Kitap & Hobi"], [Dumbbell, "Spor & Outdoor"], [Bike, "Bisiklet"], [Car, "Otomotiv"],
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles size={16} /> Yeniden değerlendir</span>
            <h1>Aradığın ikinci şans <em>burada.</em></h1>
            <p>İyi ürünler yeni sahipleriyle buluşsun. Kolayca keşfet, güvenle iletişim kur, ücretsiz ilan ver.</p>
            <form className="hero-search" action="/ilanlar">
              <Search size={22} />
              <input name="q" aria-label="Ürün ara" placeholder="Ne aramıştın?" />
              <button type="submit">Ara</button>
            </form>
            <div className="popular-searches"><span>Popüler:</span><a href="/ilanlar">Telefon</a><a href="/ilanlar">Koltuk</a><a href="/ilanlar">Bisiklet</a></div>
          </div>
          <div className="hero-visual" aria-label="İkinci el ürünler">
            <div className="hero-image-main"><img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=90" alt="Modern gri koltuk" /></div>
            <div className="floating-card floating-camera"><img src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=85" alt="Fotoğraf makinesi" /><span><strong>Yeni ilan</strong>Fotoğraf makinesi</span></div>
            <div className="floating-card floating-trust"><ShieldCheck /><span><strong>Güvenli iletişim</strong>Kontrol sende</span></div>
          </div>
        </div>
      </section>

      <section className="category-section container" aria-labelledby="categories-title">
        <div className="section-heading"><div><span className="section-kicker">Keşfet</span><h2 id="categories-title">Kategorilere göz at</h2></div><Link href="/ilanlar">Tüm kategoriler <ArrowRight size={17} /></Link></div>
        <div className="category-grid">
          {categoryItems.map(([Icon, label]) => <Link className="category-card" href="/ilanlar" key={label as string}><span><Icon size={25} /></span>{label as string}</Link>)}
          <Link className="category-card category-all" href="/ilanlar"><span><Grid3X3 size={25} /></span>Tümü</Link>
        </div>
      </section>

      <section className="listings-section">
        <div className="container">
          <div className="section-heading"><div><span className="section-kicker">Yeni eklenenler</span><h2>Kaçırılmayacak ilanlar</h2></div><Link href="/ilanlar">Tüm ilanları gör <ArrowRight size={17} /></Link></div>
          <div className="listing-grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
        </div>
      </section>

      <section id="nasil-calisir" className="container steps-section">
        <div className="steps-copy"><span className="section-kicker">Basit ve hızlı</span><h2>Satmak üç adım kadar kolay</h2><p>Kullanmadığın ürünleri birkaç dakikada yeni sahibiyle buluştur.</p><Link className="primary-button" href="/ilan-ver">İlan vermeye başla <ArrowRight size={18} /></Link></div>
        <div className="steps-list">
          <div><span>01</span><section><h3>Fotoğrafları ekle</h3><p>Ürününü farklı açılardan gösteren net fotoğraflar yükle.</p></section></div>
          <div><span>02</span><section><h3>Bilgileri tamamla</h3><p>Ürün durumunu, açıklamasını ve fiyatını belirle.</p></section></div>
          <div><span>03</span><section><h3>İlanını yayınla</h3><p>Kontrol ettikten sonra ilanını ücretsiz yayınla.</p></section></div>
        </div>
      </section>

      <section className="trust-band">
        <div className="container trust-grid">
          <div><ShieldCheck /><span><strong>Güvenli alışveriş</strong>Kontrollü iletişim</span></div>
          <div><Zap /><span><strong>Hızlı ve pratik</strong>Dakikalar içinde ilan</span></div>
          <div><UsersRound /><span><strong>Herkes için kolay</strong>Sade ve anlaşılır deneyim</span></div>
        </div>
      </section>
    </main>
  );
}
