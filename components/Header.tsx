"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { Grid3X3, Heart, Menu, Plus, UserRound } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { AccountPanel } from "./AccountPanel";

export function Header() {
  const [signedIn, setSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [name, setName] = useState("Hesabım");
  const [open, setOpen] = useState(false);
  const [favoriteCount,setFavoriteCount]=useState(0);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
      setName(session?.user.user_metadata.full_name || "Hesabım");
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(()=>{
    const supabase=getSupabase();
    if(!supabase||!signedIn){setFavoriteCount(0);return;}
    const load=async()=>{
      const {count}=await supabase.from("favorites").select("listing_id",{count:"exact",head:true});
      setFavoriteCount(count??0);
    };
    void load();
    window.addEventListener("satgital:favorites-changed",load);
    return()=>window.removeEventListener("satgital:favorites-changed",load);
  },[signedIn]);


  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label="Satgital ana sayfa">
          <img className="brand-logo" src="/brand/satgital-logo.png" width="859" height="216" alt="Satgital" />
        </Link>
        <nav className="desktop-nav" aria-label="Ana menü">
          <Link href="/ilanlar"><Grid3X3 size={18} /> Kategoriler</Link>
          <Link href="/ilanlar">İlanlar</Link>
          <Link href="/#nasil-calisir">Nasıl Çalışır?</Link>
        </nav>
        <div className="header-actions">
          <Link className="icon-link favorite-header-link desktop-only" href="/favorilerim" aria-label={`Favorilerim${favoriteCount?` (${favoriteCount})`:""}`}><Heart size={20} />{favoriteCount>0&&<span>{favoriteCount>99?"99+":favoriteCount}</span>}</Link>
          {authReady && (signedIn
            ? <button className="login-link auth-button account-trigger" onClick={() => setOpen(true)} aria-haspopup="dialog"><UserRound size={20} /> {name}</button>
            : <Link className="login-link desktop-only" href="/giris"><UserRound size={20} /> Giriş Yap</Link>
          )}
          <Link className="primary-button header-cta" href={authReady && !signedIn ? "/giris?reason=listing" : "/ilan-ver"}><Plus size={19} /> <span>Ücretsiz İlan Ver</span></Link>
          <button className="mobile-menu" aria-label="Menüyü aç"><Menu /></button>
        </div>
      </div>
      {open && <AccountPanel name={name} onClose={() => setOpen(false)} />}
    </header>
  );
}
