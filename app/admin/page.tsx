"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Archive, CheckCircle2, ImageOff, KeyRound, LayoutDashboard, LogOut, ShieldCheck, Trash2, Users } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

type ListingStatus = "draft" | "published" | "sold" | "archived";
type AdminListing = {
  id: string;
  title: string;
  price: number | string;
  city: string;
  status: ListingStatus;
  seller_display_name: string;
  created_at: string;
  listing_images: { object_path: string; sort_order: number }[] | null;
  imageUrl: string | null;
};

const statusLabels: Record<ListingStatus, string> = { draft: "Taslak", published: "Aktif", sold: "Satıldı", archived: "Pasif" };

function formatSupabaseError(value: unknown, fallback: string) {
  if (!value || typeof value !== "object") return fallback;
  const error = value as { code?: string; message?: string; hint?: string };
  const parts = [error.code, error.message, error.hint].filter(Boolean);
  return parts.length ? parts.join(" · ") : fallback;
}

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [userCount, setUserCount] = useState(0);

  async function verifyAdmin() {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data, error: roleError } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
    return !roleError && Boolean(data);
  }

  async function loadDashboard() {
    const supabase = getSupabase();
    if (!supabase) return;
    setLoading(true); setError("");
    try {
      const [listingResult, profileResult] = await Promise.all([
        supabase.from("listings").select("id,title,price,city,status,seller_display_name,created_at,listing_images(object_path,sort_order)").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      if (listingResult.error) {
        setError(`İlanlar yüklenemedi: ${formatSupabaseError(listingResult.error, "Bilinmeyen veritabanı hatası")}`);
        return;
      }
      if (profileResult.error) setNotice(`Kullanıcı sayacı alınamadı: ${formatSupabaseError(profileResult.error, "Yetki hatası")}`);
      const rows = (listingResult.data ?? []) as unknown as Omit<AdminListing, "imageUrl">[];
      const mapped = await Promise.all(rows.map(async (listing) => {
        const path = [...(listing.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.object_path;
        if (!path) return { ...listing, imageUrl: null };
        const { data } = await supabase.storage.from("listing-images").createSignedUrl(path, 3_600);
        return { ...listing, imageUrl: data?.signedUrl ?? null };
      }));
      setListings(mapped);
      setUserCount(profileResult.error ? 0 : profileResult.count ?? 0);
    } catch (dashboardError) {
      setError(formatSupabaseError(dashboardError, "Yönetim verileri yüklenemedi."));
    } finally { setLoading(false); }
  }

  useEffect(() => {
    void (async () => {
      const isAdmin = await verifyAdmin();
      setAuthorized(isAdmin);
      setChecking(false);
      if (isAdmin) await loadDashboard();
    })();
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true);
    const values = new FormData(event.currentTarget);
    const username = String(values.get("username") ?? "").trim();
    const password = String(values.get("password") ?? "");
    if (username.toLocaleLowerCase("tr-TR") !== "admin") { setError("Kullanıcı adı veya şifre hatalı."); setLoading(false); return; }
    const supabase = getSupabase();
    if (!supabase) { setError("Güvenli bağlantı kurulamadı."); setLoading(false); return; }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: "admin@satgital.com.tr", password });
    if (signInError || !(await verifyAdmin())) {
      if (!signInError) await supabase.auth.signOut();
      setError("Kullanıcı adı veya şifre hatalı."); setLoading(false); return;
    }
    setAuthorized(true); setLoading(false); await loadDashboard();
  }

  async function updateStatus(listing: AdminListing, status: ListingStatus) {
    const supabase = getSupabase();
    if (!supabase) return;
    setBusyId(listing.id); setError(""); setNotice("");
    const values = status === "published" ? { status, published_at: new Date().toISOString() } : { status };
    const { error: updateError } = await supabase.from("listings").update(values).eq("id", listing.id);
    if (updateError) setError(`İlan güncellenemedi: ${updateError.message}`);
    else { setListings((current) => current.map((item) => item.id === listing.id ? { ...item, status } : item)); setNotice("İlan durumu güncellendi."); }
    setBusyId(null);
  }

  async function deleteListing(listing: AdminListing) {
    if (!window.confirm(`“${listing.title}” ilanını kalıcı olarak silmek istediğinize emin misiniz?`)) return;
    const supabase = getSupabase();
    if (!supabase) return;
    setBusyId(listing.id); setError(""); setNotice("");
    const paths = (listing.listing_images ?? []).map((image) => image.object_path);
    if (paths.length) {
      const { error: storageError } = await supabase.storage.from("listing-images").remove(paths);
      if (storageError) { setError(`Fotoğraflar silinemedi: ${storageError.message}`); setBusyId(null); return; }
    }
    const { error: deleteError } = await supabase.from("listings").delete().eq("id", listing.id);
    if (deleteError) setError(`İlan silinemedi: ${deleteError.message}`);
    else { setListings((current) => current.filter((item) => item.id !== listing.id)); setNotice("İlan kalıcı olarak silindi."); }
    setBusyId(null);
  }

  async function logout() {
    await getSupabase()?.auth.signOut();
    setAuthorized(false); setListings([]); setNotice("");
  }

  if (checking) return <main className="admin-login-page"><p>Yetki doğrulanıyor...</p></main>;

  if (!authorized) return <main className="admin-login-page"><section className="admin-login-card">
    <Link href="/" className="brand auth-brand"><img className="brand-logo" src="/brand/satgital-logo.png" width="859" height="216" alt="Satgital"/></Link>
    <span className="admin-secure-label"><ShieldCheck/> Güvenli yönetici girişi</span><div><h1>Admin Paneli</h1><p>Yönetim araçlarına erişmek için yetkili hesabınla giriş yap.</p></div>
    <form onSubmit={login}><label>Kullanıcı adı<input name="username" autoComplete="username" required defaultValue="Admin"/></label><label>Şifre<div className="icon-input"><KeyRound/><input name="password" type="password" autoComplete="current-password" minLength={12} required placeholder="Güvenli şifreniz"/></div></label>{error && <p className="upload-error" role="alert">{error}</p>}<button className="primary-button full-button" disabled={loading} type="submit">{loading ? "Doğrulanıyor..." : "Giriş yap"} <ShieldCheck/></button></form>
    <p className="admin-login-note">Parola uygulama kodunda tutulmaz; Supabase Auth ve RLS ile doğrulanır.</p>
  </section></main>;

  const activeCount = listings.filter((listing) => listing.status === "published").length;
  const passiveCount = listings.filter((listing) => listing.status === "archived" || listing.status === "draft").length;
  const soldCount = listings.filter((listing) => listing.status === "sold").length;

  return <main className="admin-page"><div className="container">
    <header className="admin-header"><div><span className="section-kicker">Yönetim merkezi</span><h1>Admin Paneli</h1><p>Kullanıcıları ve ilan durumlarını güvenli biçimde yönet.</p></div><div><Link className="secondary-button" href="/"><LayoutDashboard/> Siteye dön</Link><button className="secondary-button" onClick={() => void logout()}><LogOut/> Çıkış</button></div></header>
    {error && <p className="upload-error" role="alert">{error}</p>}{notice && <p className="form-note" role="status">{notice}</p>}
    <section className="admin-stats"><article><Users/><span>Kullanıcılar</span><strong>{userCount}</strong></article><article><Archive/><span>Tüm ilanlar</span><strong>{listings.length}</strong></article><article><CheckCircle2/><span>Aktif</span><strong>{activeCount}</strong></article><article><Archive/><span>Pasif</span><strong>{passiveCount}</strong></article><article><CheckCircle2/><span>Satıldı</span><strong>{soldCount}</strong></article></section>
    <section className="admin-listings"><div className="admin-section-title"><div><h2>İlan yönetimi</h2><p>Tüm ilanları incele, durumunu değiştir veya kaldır.</p></div><span>{loading ? "Yükleniyor..." : `${listings.length} ilan`}</span></div>
      {!loading && listings.length === 0 ? <div className="my-listings-empty"><ImageOff/><h2>Henüz ilan bulunmamaktadır.</h2></div> : <div className="admin-listing-grid">{listings.map((listing) => <article className="admin-listing-card" key={listing.id}><div className="admin-listing-image">{listing.imageUrl ? <img src={listing.imageUrl} alt={listing.title}/> : <ImageOff/>}<span className={`listing-status status-${listing.status}`}>{statusLabels[listing.status]}</span></div><div className="admin-listing-copy"><div><small>{listing.seller_display_name}</small><h3>{listing.title}</h3><p>{listing.city} · {new Intl.DateTimeFormat("tr-TR").format(new Date(listing.created_at))}</p></div><strong>{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(listing.price))}</strong><div className="admin-listing-actions"><label>Durum<select value={listing.status} disabled={busyId === listing.id} onChange={(event) => void updateStatus(listing, event.target.value as ListingStatus)}><option value="draft">Taslak</option><option value="published">Aktif</option><option value="archived">Pasif</option><option value="sold">Satıldı</option></select></label><button className="manage-button danger" disabled={busyId === listing.id} onClick={() => void deleteListing(listing)}><Trash2/> Sil</button></div></div></article>)}</div>}
    </section>
  </div></main>;
}
