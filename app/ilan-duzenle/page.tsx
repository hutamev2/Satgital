"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Camera, Check, ImagePlus, X } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

type Category = { id: number; name: string };
type ExistingImage = { id: number; object_path: string; sort_order: number; url: string };
type NewImage = { id: string; file: File; url: string };
type ListingForm = {
  id: string;
  category_id: number;
  title: string;
  description: string;
  condition: string;
  warranty: string;
  price: number | string;
  city: string;
};

const cities = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya"];

export default function EditListingPage() {
  const [listing, setListing] = useState<ListingForm | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [removedImages, setRemovedImages] = useState<ExistingImage[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    const supabase = getSupabase();
    if (!id || !supabase) { setNotice("İlan bulunamadı."); setLoading(false); return; }
    void (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.replace("/giris/"); return; }
        const [listingResult, categoryResult] = await Promise.all([
          supabase.from("listings").select("id,category_id,title,description,condition,warranty,price,city,listing_images(id,object_path,sort_order)").eq("id", id).eq("seller_id", user.id).single(),
          supabase.from("categories").select("id,name").eq("is_active", true).order("name"),
        ]);
        if (listingResult.error || !listingResult.data) throw new Error("İlan bulunamadı veya bu ilanı düzenleme yetkiniz yok.");
        if (categoryResult.error) throw categoryResult.error;
        const row = listingResult.data as unknown as ListingForm & { listing_images: Omit<ExistingImage, "url">[] | null };
        setListing({ id: row.id, category_id: row.category_id, title: row.title, description: row.description, condition: row.condition, warranty: row.warranty, price: row.price, city: row.city });
        setCategories((categoryResult.data ?? []) as Category[]);
        const images = await Promise.all([...(row.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order).map(async (image) => {
          const { data } = await supabase.storage.from("listing-images").createSignedUrl(image.object_path, 3_600);
          return { ...image, url: data?.signedUrl ?? "" };
        }));
        setExistingImages(images);
      } catch (error) { setNotice(error instanceof Error ? error.message : "İlan yüklenemedi."); }
      finally { setLoading(false); }
    })();
  }, []);

  function addImages(files: FileList | null) {
    if (!files) return;
    setNotice("");
    const slots = 8 - existingImages.length - newImages.length;
    const selected = Array.from(files).slice(0, slots);
    const accepted = selected.filter((file) => {
      if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) { setNotice("Fotoğraflar PNG, JPG veya WEBP olmalı ve 10 MB'ı geçmemelidir."); return false; }
      return true;
    });
    setNewImages((current) => [...current, ...accepted.map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }))]);
  }

  function removeExisting(image: ExistingImage) {
    if (existingImages.length + newImages.length <= 1) { setNotice("İlanda en az bir fotoğraf kalmalıdır."); return; }
    setExistingImages((current) => current.filter((item) => item.id !== image.id));
    setRemovedImages((current) => [...current, image]);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!listing) return;
    const supabase = getSupabase();
    if (!supabase) return;
    setSaving(true); setNotice("");
    const values = new FormData(event.currentTarget);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.replace("/giris/"); return; }
      const { error: updateError } = await supabase.from("listings").update({
        category_id: Number(values.get("category_id")), title: String(values.get("title")).trim(), description: String(values.get("description")).trim(), condition: values.get("condition"), warranty: values.get("warranty"), price: Number(values.get("price")), city: values.get("city"), updated_at: new Date().toISOString(),
      }).eq("id", listing.id).eq("seller_id", user.id);
      if (updateError) throw updateError;

      if (removedImages.length) {
        const paths = removedImages.map((image) => image.object_path);
        const { error: storageError } = await supabase.storage.from("listing-images").remove(paths);
        if (storageError) throw storageError;
        const { error: imageError } = await supabase.from("listing_images").delete().in("id", removedImages.map((image) => image.id));
        if (imageError) throw imageError;
      }

      const orderedExisting = [...existingImages].sort((a, b) => a.sort_order - b.sort_order);
      for (const [index, image] of orderedExisting.entries()) {
        if (image.sort_order === index) continue;
        const { error: orderError } = await supabase.from("listing_images").update({ sort_order: index }).eq("id", image.id);
        if (orderError) throw orderError;
      }

      const startIndex = orderedExisting.length;
      for (const [offset, image] of newImages.entries()) {
        const extension = image.file.name.split(".").pop()?.toLocaleLowerCase("tr-TR") || "jpg";
        const objectPath = `${user.id}/${listing.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("listing-images").upload(objectPath, image.file, { contentType: image.file.type });
        if (uploadError) throw uploadError;
        const { error: imageError } = await supabase.from("listing_images").insert({ listing_id: listing.id, owner_id: user.id, object_path: objectPath, sort_order: startIndex + offset });
        if (imageError) throw imageError;
      }
      setRemovedImages([]); setNewImages([]); setNotice("İlanınız güncellendi.");
      window.setTimeout(() => window.location.assign("/ilanlarim/"), 700);
    } catch (error) { setNotice(error instanceof Error ? error.message : "İlan güncellenemedi."); }
    finally { setSaving(false); }
  }

  if (loading) return <main className="page-shell"><div className="container"><p>İlan yükleniyor...</p></div></main>;
  if (!listing) return <main className="page-shell"><div className="container narrow-container"><p className="upload-error">{notice || "İlan bulunamadı."}</p><Link className="secondary-button" href="/ilanlarim">İlanlarıma dön</Link></div></main>;

  return <main className="page-shell sell-page"><div className="container sell-container">
    <Link className="back-link" href="/ilanlarim"><ArrowLeft size={17}/> İlanlarıma dön</Link>
    <div className="page-intro"><span className="section-kicker">İlan yönetimi</span><h1>İlanı düzenle</h1><p>İlan bilgilerini ve fotoğraflarını güncelle.</p></div>
    <form className="sell-form" onSubmit={save}>
      <section className="form-section"><div className="form-section-title"><span><Camera/></span><div><h2>Ürün fotoğrafları</h2><p>{existingImages.length + newImages.length}/8 fotoğraf</p></div></div><div className="upload-preview-grid">{existingImages.map((image, index) => <div className="upload-preview" key={image.id}>{image.url ? <img src={image.url} alt={`İlan fotoğrafı ${index + 1}`}/> : null}{index === 0 && <span>Kapak</span>}<button type="button" aria-label="Fotoğrafı kaldır" onClick={() => removeExisting(image)}><X/></button></div>)}{newImages.map((image) => <div className="upload-preview" key={image.id}><img src={image.url} alt={image.file.name}/><button type="button" aria-label="Yeni fotoğrafı kaldır" onClick={() => setNewImages((current) => current.filter((item) => item.id !== image.id))}><X/></button></div>)}</div>{existingImages.length + newImages.length < 8 && <label className="upload-box compact"><ImagePlus/><strong>Fotoğraf ekle</strong><small>PNG, JPG veya WEBP · En fazla 10 MB</small><input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={(event) => { addImages(event.target.files); event.target.value = ""; }}/></label>}</section>
      <section className="form-section"><div className="form-grid"><label className="full-field">Kategori<select name="category_id" required defaultValue={String(listing.category_id)}>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label className="full-field">İlan başlığı<input name="title" required minLength={10} maxLength={80} defaultValue={listing.title}/></label><label>Ürün durumu<select name="condition" required defaultValue={listing.condition}><option>Yeni gibi</option><option>Çok iyi</option><option>İyi</option><option>Kullanılmış</option></select></label><label>Garanti durumu<select name="warranty" required defaultValue={listing.warranty}><option>Devam ediyor</option><option>Bitti</option><option>Yok</option></select></label><label className="full-field">Açıklama<textarea name="description" required minLength={20} maxLength={5000} rows={6} defaultValue={listing.description}/></label><label>Fiyat<div className="input-suffix"><input name="price" required min="1" step="0.01" type="number" defaultValue={Number(listing.price)}/><span>TL</span></div></label><label>Şehir<select name="city" required defaultValue={listing.city}>{cities.map((city) => <option key={city}>{city}</option>)}</select></label></div></section>
      {notice && <p className={notice.includes("güncellendi") ? "form-note" : "upload-error"} role="status">{notice}</p>}
      <button className="primary-button form-submit" disabled={saving} type="submit">{saving ? "Kaydediliyor..." : <><Check/> Değişiklikleri kaydet</>}</button>
    </form>
  </div></main>;
}
