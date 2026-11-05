import { Camera, Check, ChevronRight, ImagePlus, Info } from "lucide-react";
import { categories } from "@/lib/data";

export default function SellPage() {
  return (
    <main className="page-shell sell-page">
      <div className="container narrow-container">
        <div className="page-intro centered"><span className="section-kicker">Ücretsiz ilan ver</span><h1>Ürününü yeni sahibiyle buluştur</h1><p>İlanını eksiksiz oluşturmak için aşağıdaki bilgileri doldur.</p></div>
        <div className="form-progress"><div className="active"><span><Check /></span>Ürün bilgileri</div><i /><div><span>2</span>Önizleme</div><i /><div><span>3</span>Yayınla</div></div>
        <form className="sell-form">
          <section className="form-section"><div className="form-section-title"><span><Camera /></span><div><h2>Ürün fotoğrafları</h2><p>En fazla 8 fotoğraf ekleyebilirsin.</p></div></div><label className="upload-box"><ImagePlus /><strong>Fotoğraf eklemek için tıkla</strong><small>PNG veya JPG · En fazla 10 MB</small><input type="file" multiple accept="image/*" /></label></section>
          <section className="form-section"><div className="form-section-title"><span>1</span><div><h2>Temel bilgiler</h2><p>Alıcıların ürününü kolayca bulmasına yardımcı ol.</p></div></div><div className="form-grid"><label className="full-field">İlan başlığı<input required placeholder="Örn. Çok temiz MacBook Air M1" maxLength={80} /><small>En fazla 80 karakter</small></label><label>Kategori<select required defaultValue=""><option value="" disabled>Kategori seç</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>Ürün durumu<select required defaultValue=""><option value="" disabled>Durum seç</option><option>Yeni gibi</option><option>Çok iyi</option><option>İyi</option><option>Kullanılmış</option></select></label><label className="full-field">Açıklama<textarea required placeholder="Ürünün durumunu, kullanım süresini ve varsa kusurlarını açıkça yaz." rows={6} /></label></div></section>
          <section className="form-section"><div className="form-section-title"><span>2</span><div><h2>Fiyat ve konum</h2><p>İlanının son bilgilerini tamamla.</p></div></div><div className="form-grid"><label>Fiyat<div className="input-suffix"><input required type="number" placeholder="0" /><span>TL</span></div></label><label>Şehir<select required defaultValue=""><option value="" disabled>Şehir seç</option><option>İstanbul</option><option>Ankara</option><option>İzmir</option><option>Bursa</option><option>Antalya</option></select></label></div><div className="form-note"><Info /><span>Doğru fiyat ve açık bilgiler ilanının daha hızlı sonuçlanmasına yardımcı olur.</span></div></section>
          <button type="button" className="primary-button form-submit">İlanı önizle <ChevronRight /></button>
        </form>
      </div>
    </main>
  );
}
