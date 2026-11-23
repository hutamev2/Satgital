"use client";

import { cities } from "@/lib/cities";
import { PriceComparison } from "@/components/PriceComparison";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Camera, Check, ChevronRight, ImagePlus, Info, Search, X } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

import { categoryTree } from "@/lib/market-categories";

const steps = ["Kategori Seçimi", "İlan Detayları", "Önizle ve yayınla"];

type UploadImage = { id: string; name: string; url: string; file: File };

const readImage = (file: File) => new Promise<UploadImage>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`, name: file.name, url: String(reader.result), file });
  reader.onerror = () => reject(new Error("Görsel okunamadı"));
  reader.readAsDataURL(file);
});

export default function SellPage() {
  const [authChecking, setAuthChecking] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedMain, setSelectedMain] = useState(categoryTree[0].id);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [query, setQuery] = useState("");
  const [images, setImages] = useState<UploadImage[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [publishError, setPublishError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState("");
  const [previewPhoto, setPreviewPhoto] = useState(0);
  const [preview, setPreview] = useState<FormData>();
  const publishLock = useRef(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      window.location.replace("/giris/?reason=listing");
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.replace("/giris/?reason=listing");
        return;
      }
      setAuthChecking(false);
    });
  }, []);
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
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setUploadError("Yalnızca görsel dosyaları yükleyebilirsin."); return false; }
      if (file.size > 10 * 1024 * 1024) { setUploadError("Her fotoğraf en fazla 10 MB olabilir."); return false; }
      return true;
    });
    try {
      const loaded = await Promise.all(valid.map(readImage));
      setImages(current => [...current, ...loaded].slice(0, 8));
    } catch { setUploadError("Fotoğraf okunamadı. Dosyayı yeniden seçebilirsin."); }
  };
  const ActiveIcon = activeMain.icon;
  const publishListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setPublishError("");
    if (publishLock.current || published) return;
    if (!images.length) { setPublishError("En az bir ürün fotoğrafı eklemelisin."); return; }
    if (activeStep === 1) {
      setPreviewPhoto(0);
      setPreview(values);
      setActiveStep(2);
      return;
    }
    if (activeStep !== 2) return;
    const supabase = getSupabase();
    if (!supabase) { setPublishError("İlan servisine ulaşılamadı."); return; }
    publishLock.current = true;
    setPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPublishError("İlan yayınlamak için önce giriş yapmalısın."); return; }
      const { data: category, error: categoryError } = await supabase.from("categories").select("id").eq("name", selectedCategory).single();
      if (categoryError || !category) { setPublishError("Kategori bulunamadı. Supabase kurulumu kontrol edilmeli."); return; }
      const { data: listing, error: listingError } = await supabase.from("listings").insert({
        seller_id: user.id,
        category_id: category.id,
        title: values.get("title"),
        description: values.get("description"),
        condition: values.get("condition"),
        warranty: values.get("warranty"),
        price: Number(values.get("price")),
        city: values.get("city"),
      }).select("id").single();
      if (listingError || !listing) { setPublishError(listingError?.message ?? "İlan kaydedilemedi."); return; }
      for (const [index, image] of images.entries()) {
        const extension = image.file.name.split(".").pop()?.toLocaleLowerCase("tr-TR") || "jpg";
        const objectPath = `${user.id}/${listing.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadFailure } = await supabase.storage.from("listing-images").upload(objectPath, image.file, { contentType: image.file.type });
        if (uploadFailure) { setPublishError(`Fotoğraf yüklenemedi: ${uploadFailure.message}`); return; }
        const { error: imageFailure } = await supabase.from("listing_images").insert({ listing_id: listing.id, owner_id: user.id, object_path: objectPath, sort_order: index });
        if (imageFailure) { setPublishError(`Fotoğraf kaydı oluşturulamadı: ${imageFailure.message}`); return; }
      }
      const { error: publishFailure } = await supabase.from("listings").update({ status: "published", published_at: new Date().toISOString() }).eq("id", listing.id);
      if (publishFailure) { setPublishError(publishFailure.message); return; }
      setPublished(listing.id);
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : "İlan yayınlanırken beklenmeyen bir hata oluştu.");
    } finally {
      publishLock.current = false;
      setPublishing(false);
    }
  };

  if (authChecking) return <main className="page-shell auth-checking"><div className="auth-checking-card"><span className="auth-spinner" /><strong>Hesabın kontrol ediliyor...</strong></div></main>;

  return (
    <main className="page-shell sell-page">
      <div className="container sell-container">
        <div className="page-intro centered"><span className="section-kicker">Ücretsiz ilan ver</span><h1>İlanını birkaç adımda oluştur</h1><p>Doğru kategoriyi seç, ürününü anlat ve ilanını yayınla.</p></div>
        <div className="sell-stepper" aria-label="İlan oluşturma adımları">
          {steps.map((step, index) => <div className={`sell-step ${index === activeStep ? "active" : ""} ${index < activeStep ? "complete" : ""}`} key={step}><span>{index < activeStep ? <Check /> : index + 1}</span><strong>{step}</strong>{index < steps.length - 1 && <i />}</div>)}
        </div>

        {activeStep === 0 && (
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
        )}
          <div hidden={activeStep === 0}>
          <details hidden={activeStep !== 1} className="price-help"><summary>Ürünümün fiyatını karşılaştır</summary><PriceComparison photo={images[0]?.file} /></details>
          <form className="sell-form" onSubmit={publishListing}>
            <div hidden={activeStep !== 1}><div className="sell-form">
            <button className="step-back" type="button" onClick={() => setActiveStep(Math.max(0, activeStep - 1))}><ArrowLeft /> Önceki adıma dön</button>
            <div className="selected-category-summary"><ActiveIcon /><div><small>Seçilen kategori</small><strong>{activeMain.label} <ChevronRight /> {selectedCategory}</strong></div><button type="button" onClick={() => setActiveStep(0)}>Değiştir</button></div>
            <section className="form-section"><div className="form-section-title"><span><Camera /></span><div><h2>Ürün fotoğrafları</h2><p>{images.length}/8 fotoğraf eklendi. İlk fotoğraf kapak görseli olur.</p></div></div>{images.length > 0 && <div className="upload-preview-grid">{images.map((image, index) => <div className="upload-preview" key={image.id}><img src={image.url} alt={image.name} />{index === 0 && <span>Kapak</span>}<button type="button" aria-label={`${image.name} görselini kaldır`} onClick={() => setImages((current) => current.filter((item) => item.id !== image.id))}><X /></button></div>)}</div>}<label className={`upload-box ${images.length ? "compact" : ""}`}><ImagePlus /><strong>{images.length ? "Başka fotoğraf ekle" : "Fotoğraf eklemek için tıkla"}</strong><small>PNG, JPG veya WEBP · En fazla 10 MB</small><input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={(event) => { void addImages(event.target.files); event.target.value = ""; }} disabled={images.length >= 8} /></label>{uploadError && <p className="upload-error" role="alert">{uploadError}</p>}</section>
            <section className="form-section"><div className="form-section-title"><span>1</span><div><h2>İlan detayları</h2><p>Alıcıların ürününü doğru değerlendirmesine yardımcı ol.</p></div></div><div className="form-grid"><label className="full-field">İlan başlığı<input name="title" required minLength={10} placeholder="Örn. Kutulu, çok temiz iPhone 14" maxLength={80} /><small>10–80 karakter</small></label><label>Ürün durumu<select name="condition" required defaultValue=""><option value="" disabled>Durum seç</option><option>Yeni gibi</option><option>Çok iyi</option><option>İyi</option><option>Kullanılmış</option></select></label><label>Garanti durumu<select name="warranty" required defaultValue=""><option value="" disabled>Garanti seç</option><option>Devam ediyor</option><option>Bitti</option><option>Yok</option></select></label><label className="full-field">Açıklama<textarea name="description" required minLength={20} maxLength={5000} placeholder="Ürünün durumunu, kullanım süresini ve varsa kusurlarını açıkça yaz." rows={6} /></label></div></section>
            <section className="form-section"><div className="form-section-title"><span>2</span><div><h2>Fiyat ve konum</h2><p>İlanının son bilgilerini tamamla.</p></div></div><div className="form-grid"><label>Fiyat<div className="input-suffix"><input name="price" required min="1" step="0.01" type="number" placeholder="0" /><span>TL</span></div></label><label>Şehir<select name="city" required defaultValue=""><option value="" disabled>Şehir seç</option>{cities.map(city => <option key={city}>{city}</option>)}</select></label></div><div className="form-note"><Info /><span>Doğru fiyat ve açık bilgiler ilanının daha hızlı sonuçlanmasına yardımcı olur.</span></div></section>
            </div></div>
            {activeStep === 2 && preview && !published && <section className="listing-preview">
              <div className="preview-gallery"><img className="preview-cover" src={images[previewPhoto]?.url} alt={String(preview.get("title"))} />
                {images.length > 1 && <div className="preview-thumbs">{images.map((image,index) => <button key={image.id} type="button" aria-pressed={previewPhoto === index} aria-label={`${index + 1}. fotoğrafı göster`} onClick={() => setPreviewPhoto(index)}><img src={image.url} alt="" /></button>)}</div>}
              </div>
              <div className="preview-info"><small>{activeMain.label} / {selectedCategory}</small><h2>{String(preview.get("title"))}</h2><strong className="preview-price">{Number(preview.get("price")).toLocaleString("tr-TR")} TL</strong>
                <dl>{[["Konum","city"],["Ürün durumu","condition"],["Garanti","warranty"]].map(([label,key]) => <div key={key}><dt>{label}</dt><dd>{String(preview.get(key))}</dd></div>)}</dl>
                <h3>Açıklama</h3><p>{String(preview.get("description"))}</p><button type="button" className="secondary-button" disabled={publishing} onClick={() => setActiveStep(1)}>Bilgileri düzenle</button>
              </div></section>}
            {publishError && <p className="upload-error" role="alert">{publishError} {publishError.includes("giriş") && <Link href="/giris">Giriş sayfasına git</Link>}</p>}
            {published ? <div className="selected-category-bar"><div><Check /><span><small>İşlem tamamlandı</small><strong>İlanın başarıyla yayınlandı.</strong></span></div><Link href={`/ilan-detay/?id=${encodeURIComponent(published)}`}>İlanımı gör</Link></div> : <button type="submit" className="primary-button form-submit" disabled={publishing}>{publishing ? "Yayınlanıyor..." : activeStep === 1 ? "İlanı önizle" : "İlanı yayınla"} <ChevronRight /></button>}
          </form>
          </div>
      </div>
    </main>
  );
}
