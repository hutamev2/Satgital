"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, LayoutDashboard, ShoppingBag, BadgeCheck, List, Heart, Settings, LogOut, Wallet, ChevronRight } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

const tabs = ["Kontrol Panelim", "Aldığım İlanlar", "Sattığım İlanlar", "İlanlarım", "Favorilerim"];
const icons = [LayoutDashboard, ShoppingBag, BadgeCheck, List, Heart];
export function AccountPanel({name, onClose}: {name:string; onClose:()=>void}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(0);
  const [balance, setBalance] = useState<string>("Yükleniyor...");
  const [listings, setListings] = useState<{id:string; title:string; status:string}[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const el = dialog.current;
    el?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const client = getSupabase();
    void (async () => {
      try {
        if (!client) throw new Error("Hesap bağlantısı kurulamadı.");
        const {data:{user}} = await client.auth.getUser();
        if (!user) throw new Error("Lütfen tekrar giriş yapınız.");
        const [wallet, ads] = await Promise.all([
          client.from("account_balances").select("balance").eq("user_id", user.id).maybeSingle(),
          client.from("listings").select("id,title,status").eq("seller_id", user.id).order("created_at", {ascending:false})
        ]);
        setBalance(wallet.error || !wallet.data ? "Bakiye alınamadı" : new Intl.NumberFormat("tr-TR", {style:"currency", currency:"TRY"}).format(Number(wallet.data.balance)));
        if (ads.error) throw ads.error;
        setListings(ads.data ?? []);
      } catch { setError("Hesap bilgileri yüklenemedi. Paneli kapatıp tekrar deneyiniz."); }
      finally { setLoading(false); }
    })();
    return () => { document.body.style.overflow = previous; el?.close(); };
  }, []);
  async function logout() {
    const {error} = await getSupabase()!.auth.signOut();
    if (error) { setError("Çıkış yapılamadı. Tekrar deneyiniz."); return; }
    onClose(); window.location.assign("/giris/");
  }
  const shown = active === 2 ? listings.filter(x => x.status === "sold") : listings;
  return <dialog ref={dialog} className="account-panel" aria-label="Hesabım" onCancel={onClose} onClick={e => {if(e.target === dialog.current) onClose();}}>
    <div className="account-panel-inner">
      <header className="account-panel-title"><div><small>SATGİTAL</small><h2>Hesabım</h2></div><button onClick={onClose} aria-label="Paneli kapat"><X /></button></header>
      <section className="account-profile"><div className="account-identity"><span>{name.split(" ").map(x => x[0]).slice(0,2).join("")}</span><div><strong>{name}</strong><small>İyi ürünler, yeni başlangıçlar.</small></div></div><div className="account-wallet"><Wallet size={20}/><div><small>Kullanılabilir bakiye</small><strong>{balance}</strong></div></div></section>
      <nav className="account-tabs" aria-label="Hesap bölümleri">{tabs.map((label,i) => {const Icon=icons[i]; const href = i === 1 ? "/aldigim-ilanlar" : i === 2 ? "/sattigim-ilanlar" : i === 3 ? "/ilanlarim" : i === 4 ? "/favorilerim" : null; return href ? <Link key={label} href={href} onClick={onClose}><Icon size={19}/><span>{label}</span><ChevronRight size={16}/></Link> : <button key={label} className={active === i ? "selected" : ""} onClick={()=>setActive(i)} aria-pressed={active===i}><Icon size={19}/><span>{label}</span><ChevronRight size={16}/></button>;})}</nav>
      <section className="account-content" aria-live="polite"><h3>{tabs[active]}</h3>{error ? <p role="alert">{error}</p> : loading ? <p>Yükleniyor...</p> : active===0 ? <><p>İlanlarını ve hesabını buradan yönetebilirsin.</p><div className="account-stats"><div><strong>{listings.length}</strong><small>Toplam ilan</small></div><div><strong>{listings.filter(x=>x.status==="published").length}</strong><small>Yayında</small></div></div></> : active===4 ? <p>Favori ilanlarını kaydetme özelliği henüz kullanıma açılmadı.</p> : shown.length ? shown.map(x=><Link onClick={onClose} key={x.id} href={`/ilan-detay/?id=${x.id}`}>{x.title}<ChevronRight size={16}/></Link>) : <p>Bu bölümde henüz ilan bulunmuyor.</p>}</section>
      <Link className="account-settings" href="/ayarlar" onClick={onClose}><Settings size={19}/> Profil ve hesap ayarları<ChevronRight size={16}/></Link>
      <button className="account-logout" onClick={logout}><LogOut size={18}/> Çıkış yap</button>
    </div>
  </dialog>;
}
