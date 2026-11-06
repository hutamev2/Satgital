"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(""); setMessage(""); setLoading(true);
    const supabase = getSupabase();
    if (!supabase) { setError("Supabase bağlantısı henüz yapılandırılmadı."); setLoading(false); return; }
    const values = new FormData(event.currentTarget);
    const email = String(values.get("email"));
    const password = String(values.get("password"));
    if (mode === "register") {
      const { error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) setError(authError.message); else setMessage("Kayıt oluşturuldu. E-postandaki doğrulama bağlantısını aç.");
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) setError("E-posta veya şifre hatalı."); else { setMessage("Giriş başarılı."); window.location.href = "/ilan-ver/"; }
    }
    setLoading(false);
  };

  return (
    <main className="auth-page"><div className="auth-visual"><div><span className="eyebrow"><ShieldCheck size={16} /> Güvenli hesap</span><h1>Satgital&apos;da alışverişe kaldığın yerden devam et.</h1><p>Favorilerini sakla, ilanlarını yönet ve satıcılarla kolayca iletişim kur.</p></div></div><section className="auth-card"><Link className="brand" href="/">satgital<span>.</span></Link><div><h2>{mode === "login" ? "Tekrar hoş geldin" : "Ücretsiz hesap oluştur"}</h2><p>{mode === "login" ? "Hesabına giriş yap ve ilanlarını yönet." : "Satışa başlamak için birkaç saniyede kayıt ol."}</p></div><form onSubmit={submit}><label>E-posta adresi<div className="icon-input"><Mail /><input name="email" required type="email" autoComplete="email" placeholder="ornek@email.com" /></div></label><label>Şifre<div className="icon-input"><LockKeyhole /><input name="password" required minLength={8} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="En az 8 karakter" /></div></label>{error && <p className="upload-error" role="alert">{error}</p>}{message && <div className="form-note"><ShieldCheck /><span>{message}</span></div>}<button type="submit" disabled={loading} className="primary-button full-button">{loading ? "İşleniyor..." : mode === "login" ? "Giriş yap" : "Kayıt ol"} <ArrowRight /></button></form><p className="auth-switch">{mode === "login" ? "Hesabın yok mu?" : "Zaten hesabın var mı?"} <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setMessage(""); }}>{mode === "login" ? "Ücretsiz kayıt ol" : "Giriş yap"}</button></p></section></main>
  );
}
