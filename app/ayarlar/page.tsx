"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase";

export default function SettingsPage() {
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  useEffect(() => {
    const client = getSupabase();
    if (!client) { setNotice("Hesap bağlantısı kurulamadı."); return; }
    void client.auth.getUser().then(async ({data: {user}}) => {
      if (!user) { window.location.replace("/giris/"); return; }
      setName(user.user_metadata.full_name ?? "");
      setPhone(user.user_metadata.phone ?? "");
      setEmail(user.email ?? "");
      setReady(true);
      const {data, error} = await client.from("account_balances").select("balance").eq("user_id", user.id).maybeSingle();
      if (!error) setBalance(Number(data?.balance ?? 0));
    }).catch(() => setNotice("Hesap yüklenemedi. Sayfayı yenileyiniz."));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>, passwordChange = false) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const form = event.currentTarget;
    const client = getSupabase();
    if (!client) return;
    setBusy(true); setNotice("");
    try {
      if (passwordChange) {
        const password = String(values.get("password"));
        if (password !== values.get("repeat")) throw new Error("Şifreler eşleşmiyor.");
        const {error} = await client.auth.updateUser({password});
        if (error) throw error;
        form.reset();
      } else {
        if (name.trim().length < 3 || !/^[+\d\s()-]+$/.test(phone) || phone.replace(/\D/g, "").length < 10) throw new Error("Ad soyad ve geçerli telefon numarası giriniz.");
        const {error} = await client.auth.updateUser({data: {full_name: name.trim(), phone: phone.trim()}});
        if (error) throw error;
      }
      setNotice(passwordChange ? "Şifreniz güncellendi." : "Profiliniz güncellendi.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "İşlem tamamlanamadı."); }
    finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true);
    try {
      const client = getSupabase();
      if (!client) throw new Error("Bağlantı kurulamadı.");
      const {error} = await client.auth.signOut();
      if (error) throw error;
      window.location.assign("/giris/");
    } catch { setNotice("Çıkış yapılamadı. Yeniden deneyiniz."); setBusy(false); }
  }

  return <main className="page-shell"><div className="container narrow-container">
    <div className="page-intro"><h1>Hesap ayarları</h1><p>Profilini, iletişim bilgilerini ve şifreni yönet.</p></div>
    {notice && <p role="status" className="form-note">{notice}</p>}
    {!ready ? <p>Hesabınız yükleniyor...</p> : <div className="sell-form">
      <section className="form-section"><h2>Bakiyem</h2><strong className="detail-price">{balance === null ? "Bakiye yüklenemedi" : new Intl.NumberFormat("tr-TR", {style:"currency", currency:"TRY"}).format(balance)}</strong><p>Hesabınızdaki kullanılabilir bakiye.</p></section>
      <form className="form-section sell-form" onSubmit={save}><h2>Profil ve iletişim</h2>
        <label>E-posta<input value={email} readOnly type="email" /></label>
        <label>Ad Soyad<input required minLength={3} maxLength={60} autoComplete="name" value={name} onChange={e => setName(e.target.value)} /></label>
        <label>Telefon Numarası<input required type="tel" maxLength={20} autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} /></label>
        <button className="primary-button" disabled={busy}>Profili kaydet</button>
      </form>
      <form className="form-section sell-form" onSubmit={e => save(e, true)}><h2>Şifre değiştir</h2>
        <label>Yeni şifre<input name="password" required minLength={8} type="password" autoComplete="new-password" /></label>
        <label>Yeni şifre tekrar<input name="repeat" required minLength={8} type="password" autoComplete="new-password" /></label>
        <button className="primary-button" disabled={busy}>Şifreyi güncelle</button>
      </form>
      <button className="secondary-button" disabled={busy} onClick={logout}>Çıkış yap</button>
    </div>}
  </div></main>;
}
