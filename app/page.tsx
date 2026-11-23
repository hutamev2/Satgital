import Link from "next/link";
import { BadgeCheck, Camera, FileText, Grid3X3, Search, ShieldCheck, Sparkles } from "lucide-react";

import { RecentListings } from "@/components/RecentListings";
import { categoryTree } from "@/lib/market-categories";

const steps = [
  { icon: Camera, title: "Fotoğrafları ekle", copy: "Ürününü net fotoğraflarla göster." },
  { icon: FileText, title: "Detayları tamamla", copy: "Durumunu, açıklamasını ve fiyatını yaz." },
  { icon: BadgeCheck, title: "İlanını yayınla", copy: "Önizle ve birkaç dakika içinde yayına al." },
];

export default function Home() {
  return (
    <main>
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <span className="hero-kicker"><Sparkles size={17} /> İkinci elin yeni adresi</span>
            <h1>Aradığını kolayca bul, kullanmadığını hızla sat.</h1>
            <p>Binlerce ilan arasında ara, filtrele ve doğrudan satıcıyla iletişime geç.</p>
            <form className="home-search" action="/ilanlar/">
              <Search aria-hidden="true" />
              <input name="q" aria-label="İlanlarda ara" placeholder="Telefon, bisiklet, koltuk ara" />
              <button type="submit">İlan ara</button>
            </form>
            <div className="quick-searches" aria-label="Popüler aramalar">
              <span>Popüler</span>
              {['Telefon', 'Bilgisayar', 'Koltuk', 'Otomobil'].map((term) => (
                <Link key={term} href={`/ilanlar/?q=${encodeURIComponent(term)}`}>{term}</Link>
              ))}
            </div>
          </div>

          <aside className="hero-discovery" aria-label="Hızlı keşif">
            <div className="hero-discovery-head"><span>Hızlı keşif</span><Link href="/ilanlar/">Tüm ilanlar</Link></div>
            <div className="hero-category-list">
              {categoryTree.slice(0, 4).map(({ icon: Icon, label, description }) => (
                <Link key={label} href={`/ilanlar/?category=${encodeURIComponent(label)}`}>
                  <span><Icon /></span><div><strong>{label}</strong><small>{description}</small></div>
                </Link>
              ))}
            </div>
            <div className="hero-trust"><ShieldCheck /><span><strong>Güvenli iletişim</strong>Satıcı profili ve ilan geçmişi elinin altında.</span></div>
          </aside>
        </div>
      </section>

      <section className="home-section container" aria-labelledby="categories-title">
        <div className="home-section-head">
          <div><span>Kategoriler</span><h2 id="categories-title">Neye ihtiyacın var?</h2></div>
          <Link href="/ilanlar/">Tümünü keşfet</Link>
        </div>
        <div className="home-category-grid">
          {categoryTree.map(({ icon: Icon, label, description }) => (
            <Link href={`/ilanlar/?category=${encodeURIComponent(label)}`} key={label}>
              <span><Icon /></span><div><strong>{label}</strong><small>{description}</small></div>
            </Link>
          ))}
          <Link className="all-categories" href="/ilanlar/"><span><Grid3X3 /></span><div><strong>Tüm ilanlar</strong><small>Her kategoriyi görüntüle</small></div></Link>
        </div>
      </section>

      <section className="home-listings">
        <div className="container">
          <div className="home-section-head"><div><span>Yeni eklenenler</span><h2>Son ilanlar</h2></div><Link href="/ilanlar/">Tüm ilanları gör</Link></div>
          <RecentListings />
        </div>
      </section>

      <section id="nasil-calisir" className="home-section container how-it-works">
        <div className="how-copy"><span>Kolayca ilan ver</span><h2>Ürününü bugün yeni sahibiyle buluştur.</h2><p>Fotoğrafları ekle, bilgileri tamamla ve ilanını ücretsiz yayınla.</p><Link className="primary-button" href="/ilan-ver/">Ücretsiz ilan ver</Link></div>
        <div className="how-steps">
          {steps.map(({ icon: Icon, title, copy }) => <article key={title}><span><Icon /></span><div><h3>{title}</h3><p>{copy}</p></div></article>)}
        </div>
      </section>

      <section className="home-confidence"><div className="container"><ShieldCheck /><div><strong>Daha güvenli alışveriş için</strong><span>Ürünü görmeden ödeme yapma, ilan detaylarını kontrol et ve konuşmaları platform içinde tut.</span></div><Link href="/yardim/#alisveris">Güvenlik ipuçları</Link></div></section>
    </main>
  );
}
