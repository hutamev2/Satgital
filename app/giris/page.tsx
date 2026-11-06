"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Info, LockKeyhole, Mail, Phone, ShieldCheck, UserRound, X } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("reason");
    if (reason !== "listing") return;

    setNotification("İlan oluşturmadan önce giriş yapınız.");
    const timer = window.setTimeout(() => setNotification(""), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(""); setMessage(""); setLoading(true);
    const values = new FormData(event.currentTarget);
    const email = String(values.get("email"));
    const password = String(values.get("password"));
    if (mode === "register") {
      const fullName = String(values.get("fullName") ?? "").trim();
      const phone = String(values.get("phone") ?? "").trim();
      const passwordConfirmation = String(values.get("passwordConfirmation") ?? "");
      const phoneDigits = phone.replace(/\D/g, "");
      if (password !== passwordConfirmation) {
        setError("Şifreler birbiriyle eşleşmiyor.");
        setLoading(false);
        return;
      }
      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        setError("Geçerli bir telefon numarası giriniz.");
        setLoading(false);
        return;
      }
      const supabase = getSupabase();
      if (!supabase) { setError("Supabase bağlantısı henüz yapılandırılmadı."); setLoading(false); return; }
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: fullName, phone },
        },
      });
      if (authError) setError(authError.message); else setMessage("Kayıt oluşturuldu. E-postandaki doğrulama bağlantısını aç.");
    } else {
      const supabase = getSupabase();
      if (!supabase) { setError("Supabase bağlantısı henüz yapılandırılmadı."); setLoading(false); return; }
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) setError("E-posta veya şifre hatalı."); else { setMessage("Giriş başarılı."); window.location.href = "/ilan-ver/"; }
    }
    setLoading(false);
  };

  return (
    <main className="auth-page">
      <div className="auth-visual"><div><span className="eyebrow"><ShieldCheck size={16} /> Güvenli hesap</span><h1>Satgital&apos;da alışverişe kaldığın yerden devam et.</h1><p>Favorilerini sakla, ilanlarını yönet ve satıcılarla kolayca iletişim kur.</p></div></div>
      <section className="auth-card">
        <Link className="brand auth-brand" href="/"><img className="brand-logo" src="/brand/satgital-logo.png" width="859" height="216" alt="Satgital" /></Link>
        <div><h2>{mode === "login" ? "Tekrar hoş geldin" : "Ücretsiz hesap oluştur"}</h2><p>{mode === "login" ? "Hesabına giriş yap ve ilanlarını yönet." : "Satışa başlamak için birkaç saniyede kayıt ol."}</p></div>
        <form onSubmit={submit}>
          {mode === "register" && <>
            <label>Ad Soyad<div className="icon-input"><UserRound /><input name="fullName" required minLength={3} maxLength={60} type="text" autoComplete="name" placeholder="Adınız Soyadınız" /></div></label>
            <label>Telefon Numarası<div className="icon-input"><Phone /><input name="phone" required minLength={10} maxLength={20} type="tel" inputMode="tel" autoComplete="tel" placeholder="05xx xxx xx xx" /></div></label>
          </>}
          <label>E-posta adresi<div className="icon-input"><Mail /><input name="email" required type="email" autoComplete="email" placeholder="ornek@email.com" /></div></label>
          <label>Şifre<div className="icon-input"><LockKeyhole /><input name="password" required minLength={8} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="En az 8 karakter" /></div></label>
          {mode === "register" && <label>Şifre Tekrar<div className="icon-input"><LockKeyhole /><input name="passwordConfirmation" required minLength={8} type="password" autoComplete="new-password" placeholder="Şifrenizi tekrar girin" /></div></label>}
          {error && <p className="upload-error" role="alert">{error}</p>}
          {message && <div className="form-note"><ShieldCheck /><span>{message}</span></div>}
          <button type="submit" disabled={loading} className="primary-button full-button">{loading ? "İşleniyor..." : mode === "login" ? "Giriş yap" : "Kayıt ol"} <ArrowRight /></button>
        </form>
        <p className="auth-switch">{mode === "login" ? "Hesabın yok mu?" : "Zaten hesabın var mı?"} <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setMessage(""); }}>{mode === "login" ? "Ücretsiz kayıt ol" : "Giriş yap"}</button></p>
      </section>
      {notification && <div className="site-notification" role="status" aria-live="polite"><span><Info /></span><div><strong>Giriş gerekli</strong><p>{notification}</p></div><button type="button" onClick={() => setNotification("")} aria-label="Bildirimi kapat"><X /></button></div>}
    </main>
  );
}
