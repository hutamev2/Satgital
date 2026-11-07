"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, EyeOff, ImageOff, Pencil, Plus, Trash2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

type ImageRow = { object_path: string; sort_order: number };
type ListingRow = {
  id: string;
  title: string;
  price: number | string;
  city: string;
  status: "draft" | "published" | "sold" | "archived";
  created_at: string;
  listing_images: ImageRow[] | null;
};

type ManagedListing = ListingRow & { imageUrl: string | null };
type ListingFilter = "all" | "active" | "inactive";

const statusLabels: Record<ListingRow["status"], string> = {
  draft: "Taslak",
  published: "Yayında",
  sold: "Satıldı",
  archived: "Pasif",
};

export default function MyListingsPage() {
  const [listings, setListings] = useState<ManagedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ListingFilter>("all");

  const activeCount = listings.filter((listing) => listing.status === "published").length;
  const inactiveCount = listings.filter((listing) => listing.status === "archived" || listing.status === "draft").length;
  const filteredListings = listings.filter((listing) => {
    if (filter === "active") return listing.status === "published";
    if (filter === "inactive") return listing.status === "archived" || listing.status === "draft";
    return true;
  });

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) { setNotice("Hesap bağlantısı kurulamadı."); setLoading(false); return; }
    void (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.replace("/giris/"); return; }
        const { data, error } = await supabase
          .from("listings")
          .select("id,title,price,city,status,created_at,listing_images(object_path,sort_order)")
          .eq("seller_id", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        const rows = (data ?? []) as unknown as ListingRow[];
        const mapped = await Promise.all(rows.map(async (listing) => {
          const imagePath = [...(listing.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.object_path;
          if (!imagePath) return { ...listing, imageUrl: null };
          const { data: signed } = await supabase.storage.from("listing-images").createSignedUrl(imagePath, 3_600);
          return { ...listing, imageUrl: signed?.signedUrl ?? null };
        }));
        setListings(mapped);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "İlanlarınız yüklenemedi.");
      } finally { setLoading(false); }
    })();
  }, []);

  async function toggleListing(listing: ManagedListing) {
    const supabase = getSupabase();
    if (!supabase) return;
    const nextStatus = listing.status === "published" ? "archived" : "published";
    setBusyId(listing.id); setNotice("");
    const update = nextStatus === "published"
      ? { status: nextStatus, published_at: new Date().toISOString() }
      : { status: nextStatus };
    const { data, error } = await supabase.from("listings").update(update).eq("id", listing.id).select("status").single();
    if (error) setNotice(`İlan durumu değiştirilemedi: ${error.message}`);
    else {
      setListings((current) => current.map((item) => item.id === listing.id ? { ...item, status: data.status as ListingRow["status"] } : item));
      setNotice(nextStatus === "published" ? "İlan yeniden yayına alındı." : "İlan pasife alındı.");
    }
    setBusyId(null);
  }

  async function deleteListing(listing: ManagedListing) {
    if (!window.confirm(`“${listing.title}” ilanını kalıcı olarak silmek istediğinize emin misiniz?`)) return;
    const supabase = getSupabase();
    if (!supabase) return;
    setBusyId(listing.id); setNotice("");
    const paths = (listing.listing_images ?? []).map((image) => image.object_path);
    if (paths.length) {
      const { error: storageError } = await supabase.storage.from("listing-images").remove(paths);
      if (storageError) { setNotice(`İlan fotoğrafları silinemedi: ${storageError.message}`); setBusyId(null); return; }
    }
    const { error } = await supabase.from("listings").delete().eq("id", listing.id);
    if (error) setNotice(`İlan silinemedi: ${error.message}`);
    else { setListings((current) => current.filter((item) => item.id !== listing.id)); setNotice("İlan kalıcı olarak silindi."); }
    setBusyId(null);
  }

  return <main className="page-shell my-listings-page"><div className="container">
    <div className="my-listings-header"><div className="page-intro"><span className="section-kicker">Hesabım</span><h1>İlanlarım</h1><p>İlanlarını görüntüle, düzenle veya yayın durumunu değiştir.</p></div><Link className="primary-button" href="/ilan-ver"><Plus size={18}/> İlan ekle</Link></div>
    {notice && <p className="form-note" role="status">{notice}</p>}
    {loading ? <div className="my-listings-empty"><p>İlanlarınız yükleniyor...</p></div> : listings.length === 0 ? <div className="my-listings-empty"><ImageOff/><h2>Aktif ilanınız bulunmamaktadır.</h2><p>İlk ilanınızı ücretsiz oluşturup hemen yayınlayabilirsiniz.</p><Link className="primary-button" href="/ilan-ver"><Plus size={18}/> İlan ekle</Link></div> : <>
      <div className="listing-filters" aria-label="İlanları filtrele">
        <button className={filter === "all" ? "active" : ""} type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Tümü <span>{listings.length}</span></button>
        <button className={filter === "active" ? "active" : ""} type="button" aria-pressed={filter === "active"} onClick={() => setFilter("active")}>Aktif <span>{activeCount}</span></button>
        <button className={filter === "inactive" ? "active" : ""} type="button" aria-pressed={filter === "inactive"} onClick={() => setFilter("inactive")}>Pasif <span>{inactiveCount}</span></button>
      </div>
      {filteredListings.length === 0 ? <div className="my-listings-empty filtered-empty"><ImageOff/><h2>{filter === "active" ? "Aktif ilanınız bulunmamaktadır." : "Pasif ilanınız bulunmamaktadır."}</h2><p>Diğer ilanlarınızı görmek için farklı bir filtre seçebilirsiniz.</p></div> : <div className="managed-listing-grid">{filteredListings.map((listing) => <article className="managed-listing-card" key={listing.id}>
      <div className="managed-listing-image">{listing.imageUrl ? <img src={listing.imageUrl} alt={listing.title}/> : <ImageOff/>}<span className={`listing-status status-${listing.status}`}>{statusLabels[listing.status]}</span></div>
      <div className="managed-listing-body"><div><h2>{listing.title}</h2><p>{listing.city} · {new Intl.DateTimeFormat("tr-TR").format(new Date(listing.created_at))}</p></div><strong>{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(listing.price))}</strong>
        <div className="managed-listing-actions"><Link className="manage-button" href={`/ilan-duzenle/?id=${encodeURIComponent(listing.id)}`}><Pencil/> Düzenle</Link>{listing.status !== "sold" && <button className="manage-button" disabled={busyId === listing.id} onClick={() => void toggleListing(listing)}>{listing.status === "published" ? <EyeOff/> : <Eye/>}{listing.status === "published" ? "Pasife al" : "Yayınla"}</button>}<button className="manage-button danger" disabled={busyId === listing.id} onClick={() => void deleteListing(listing)}><Trash2/> Sil</button></div>
      </div>
    </article>)}</div>}</>}
  </div></main>;
}
