"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Building2, Camera, Car, Check, ChevronRight, Gamepad2, Home, ImagePlus, Info, Laptop, Search, Shirt, Smartphone, X } from "lucide-react";

const categoryTree = [
  { id: "telefon", label: "Cep Telefonu", description: "Telefon ve mobil cihazlar", icon: Smartphone, children: ["Yenilenmiş Cep Telefonu", "Yurt Dışı Cep Telefonu", "İkinci El Cep Telefonu", "Tuşlu Telefon", "Cep Telefonu Aksesuarları"] },
  { id: "bilgisayar", label: "Bilgisayar", description: "Bilgisayar ve donanım", icon: Laptop, children: ["Dizüstü Bilgisayar", "Masaüstü Bilgisayar", "Tablet", "Monitör", "Bilgisayar Bileşenleri"] },
  { id: "ev", label: "Ev & Yaşam", description: "Mobilya ve ev eşyaları", icon: Home, children: ["Koltuk & Oturma Grubu", "Masa & Sandalye", "Dolap & Kitaplık", "Beyaz Eşya", "Ev Dekorasyonu"] },
  { id: "giyim", label: "Giyim", description: "Moda ve aksesuar", icon: Shirt, children: ["Kadın Giyim", "Erkek Giyim", "Ayakkabı", "Çanta", "Saat & Aksesuar"] },
  { id: "otomotiv", label: "Otomotiv", description: "Araç ve ekipman", icon: Car, children: ["Otomobil", "Motosiklet", "Jant & Lastik", "Oto Ses & Görüntü", "Yedek Parça"] },
  { id: "oyun", label: "Oyun & Hobi", description: "Konsol, oyun ve koleksiyon", icon: Gamepad2, children: ["Oyun Konsolu", "Konsol Oyunları", "Oyuncu Ekipmanları", "Koleksiyon", "Müzik Aletleri"] },
];

const steps = ["Kategori Seçimi", "İlan Detayları", "Önizleme", "Doping", "Yayınla"];

type UploadImage = { id: string; name: string; url: string };

const readImage = (file: File) => new Promise<UploadImage>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`, name: file.name, url: String(reader.result) });
  reader.onerror = () => reject(new Error("Görsel okunamadı"));
  reader.readAsDataURL(file);
});

export default function SellPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedMain, setSelectedMain] = useState(categoryTree[0].id);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [query, setQuery] = useState("");
  const [images, setImages] = useState<UploadImage[]>([]);
  const [uploadError, setUploadError] = useState("");
  const activeMain = categoryTree.find((category) => category.id === selectedMain) ?? categoryTree[0];
  const searchResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    if (normalized.length < 2) return [];
    return categoryTree.flatMap((main) => main.children.filter((child) => `${main.label} ${child}`.toLocaleLowerCase("tr-TR").includes(normalized)).map((child) => ({ main, child })));
  }, [query]);
  const chooseCategory = (mainId: string, child: string) => { setSelectedMain(mainId); setSelectedCategory(child); setQuery(""); };
  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadError("");
    const availableSlots = 8 - images.length;
    const selected = Array.from(files).slice(0, availableSlots);
    if (files.length > availableSlots) setUploadError("Bir ilana en fazla 8 fotoğraf ekleyebilirsin.");
    const valid = selected.filter((file) => {
      if (!file.type.startsWith("image/")) { setUploadError("Yalnızca görsel dosyaları yükleyebilirsin."); return false; }
      if (file.size > 10 * 1024 * 1024) { setUploadError("Her fotoğraf en fazla 10 MB olabilir."); return false; }
      return true;
    });
    const loaded = await Promise.all(valid.map(readImage));
    setImages((current) => [...current, ...loaded].slice(0, 8));
  };
  const ActiveIcon = activeMain.icon;

  return (
    <main className="page-shell sell-page">
      <div className="container sell-container">
        <div className="page-intro centered"><span className="section-kicker">Ücretsiz ilan ver</span><h1>İlanını birkaç adımda oluştur</h1><p>Doğru kategoriyi seç, ürününü anlat ve ilanını yayınla.</p></div>
        <div className="sell-stepper" aria-label="İlan oluşturma adımları">
          {steps.map((step, index) => <div className={`sell-step ${index === activeStep ? "active" : ""} ${index < activeStep ? "complete" : ""}`} key={step}><span>{index < activeStep ? <Check /> : index + 1}</span><strong>{step}</strong>{index < steps.length - 1 && <i />}</div>)}
        </div>

        {activeStep === 0 ? (
          <section className="category-picker form-section">
            <div className="form-section-title category-title"><span><Building2 /></span><div><h2>İlanın hangi kategoride?</h2><p>Önce ana kategoriyi, ardından ilanına en uygun alt kategoriyi seç.</p></div></div>
            <div className="category-picker-layout">
              <div className="main-category-list">
                {categoryTree.map((category) => { const Icon = category.icon; return <button className={selectedMain === category.id ? "selected" : ""} key={category.id} onClick={() => { setSelectedMain(category.id); setSelectedCategory(""); }} type="button"><span><Icon /></span><div><strong>{category.label}</strong><small>{category.description}</small></div><ChevronRight /></button>; })}
              </div>
              <div className="subcategory-panel">
                <div className="subcategory-heading"><span><ActiveIcon /></span><div><small>Ana kategori</small><h3>{activeMain.label}</h3></div></div>
                <div className="subcategory-list">
                  {activeMain.children.map((child) => <button className={selectedCategory === child ? "selected" : ""} key={child} onClick={() => setSelectedCategory(child)} type="button"><span>{child}</span>{selectedCategory === child ? <Check /> : <ChevronRight />}</button>)}
                </div>
              </div>
            </div>

            <div className="category-search-area">
              <div className="category-search-copy"><Search /><div><strong>Kategorini yazarak bul</strong><span>Örneğin “yurt dışı cep telefonu” yazabilirsin.</span></div></div>
              <div className="category-search-input"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kategori ara..." aria-label="Kategori ara" />{query && <button type="button" onClick={() => setQuery("")}>Temizle</button>}</div>
              {query.length >= 2 && <div className="category-search-results">{searchResults.length ? searchResults.map(({ main, child }) => { const Icon = main.icon; return <button type="button" key={`${main.id}-${child}`} onClick={() => chooseCategory(main.id, child)}><span><Icon /></span><div><strong>{child}</strong><small>{main.label} <ChevronRight /> {child}</small></div><ChevronRight /></button>; }) : <div className="category-empty">Bu aramayla eşleşen kategori bulunamadı.</div>}</div>}
            </div>

            {selectedCategory && <div className="selected-category-bar"><div><Check /><span><small>Seçilen kategori</small><strong>{activeMain.label} <ChevronRight /> {selectedCategory}</strong></span></div><button type="button" onClick={() => setSelectedCategory("")}>Değiştir</button></div>}
            <button type="button" className="primary-button category-continue" disabled={!selectedCategory} onClick={() => setActiveStep(1)}>İlan detaylarına geç <ChevronRight /></button>
          </section>
        ) : (
          <form className="sell-form">
            <button className="step-back" type="button" onClick={() => setActiveStep(0)}><ArrowLeft /> Kategori seçimine dön</button>
            <div className="selected-category-summary"><ActiveIcon /><div><small>Seçilen kategori</small><strong>{activeMain.label} <ChevronRight /> {selectedCategory}</strong></div><button type="button" onClick={() => setActiveStep(0)}>Değiştir</button></div>
            <section className="form-section"><div className="form-section-title"><span><Camera /></span><div><h2>Ürün fotoğrafları</h2><p>{images.length}/8 fotoğraf eklendi. İlk fotoğraf kapak görseli olur.</p></div></div>{images.length > 0 && <div className="upload-preview-grid">{images.map((image, index) => <div className="upload-preview" key={image.id}><img src={image.url} alt={image.name} />{index === 0 && <span>Kapak</span>}<button type="button" aria-label={`${image.name} görselini kaldır`} onClick={() => setImages((current) => current.filter((item) => item.id !== image.id))}><X /></button></div>)}</div>}<label className={`upload-box ${images.length ? "compact" : ""}`}><ImagePlus /><strong>{images.length ? "Başka fotoğraf ekle" : "Fotoğraf eklemek için tıkla"}</strong><small>PNG, JPG veya WEBP · En fazla 10 MB</small><input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={(event) => { void addImages(event.target.files); event.target.value = ""; }} disabled={images.length >= 8} /></label>{uploadError && <p className="upload-error" role="alert">{uploadError}</p>}</section>
            <section className="form-section"><div className="form-section-title"><span>1</span><div><h2>İlan detayları</h2><p>Alıcıların ürününü doğru değerlendirmesine yardımcı ol.</p></div></div><div className="form-grid"><label className="full-field">İlan başlığı<input required placeholder="Örn. Kutulu, çok temiz iPhone 14" maxLength={80} /><small>En fazla 80 karakter</small></label><label>Ürün durumu<select required defaultValue=""><option value="" disabled>Durum seç</option><option>Yeni gibi</option><option>Çok iyi</option><option>İyi</option><option>Kullanılmış</option></select></label><label>Garanti durumu<select required defaultValue=""><option value="" disabled>Garanti seç</option><option>Devam ediyor</option><option>Bitti</option><option>Yok</option></select></label><label className="full-field">Açıklama<textarea required placeholder="Ürünün durumunu, kullanım süresini ve varsa kusurlarını açıkça yaz." rows={6} /></label></div></section>
            <section className="form-section"><div className="form-section-title"><span>2</span><div><h2>Fiyat ve konum</h2><p>İlanının son bilgilerini tamamla.</p></div></div><div className="form-grid"><label>Fiyat<div className="input-suffix"><input required type="number" placeholder="0" /><span>TL</span></div></label><label>Şehir<select required defaultValue=""><option value="" disabled>Şehir seç</option><option>İstanbul</option><option>Ankara</option><option>İzmir</option><option>Bursa</option><option>Antalya</option></select></label></div><div className="form-note"><Info /><span>Doğru fiyat ve açık bilgiler ilanının daha hızlı sonuçlanmasına yardımcı olur.</span></div></section>
            <button type="button" className="primary-button form-submit" onClick={() => setActiveStep(2)}>İlanı önizle <ChevronRight /></button>
          </form>
        )}
      </div>
    </main>
  );
}
