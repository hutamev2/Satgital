"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Grid3X3, Heart, Menu, Plus, UserRound } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export function Header() {
  const [signedIn, setSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
  }

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
          <Link className="icon-link desktop-only" href="/ilanlar" aria-label="Favorilerim"><Heart size={20} /></Link>
          {authReady && (signedIn
            ? <button className="login-link desktop-only auth-button" type="button" onClick={signOut}><UserRound size={20} /> Çıkış Yap</button>
            : <Link className="login-link desktop-only" href="/giris"><UserRound size={20} /> Giriş Yap</Link>
          )}
          <Link className="primary-button header-cta" href={authReady && !signedIn ? "/giris?reason=listing" : "/ilan-ver"}><Plus size={19} /> <span>Ücretsiz İlan Ver</span></Link>
          <button className="mobile-menu" aria-label="Menüyü aç"><Menu /></button>
        </div>
      </div>
    </header>
  );
}
