import Link from "next/link";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="auth-page"><div className="auth-visual"><div><span className="eyebrow"><ShieldCheck size={16} /> Güvenli hesap</span><h1>Satgital&apos;da alışverişe kaldığın yerden devam et.</h1><p>Favorilerini sakla, ilanlarını yönet ve satıcılarla kolayca iletişim kur.</p></div></div><section className="auth-card"><Link className="brand" href="/">satgital<span>.</span></Link><div><h2>Tekrar hoş geldin</h2><p>Hesabına giriş yap veya ücretsiz kayıt ol.</p></div><form><label>E-posta adresi<div className="icon-input"><Mail /><input type="email" placeholder="ornek@email.com" /></div></label><label>Şifre<div className="icon-input"><LockKeyhole /><input type="password" placeholder="••••••••" /></div></label><div className="auth-options"><label><input type="checkbox" /> Beni hatırla</label><a href="#">Şifremi unuttum</a></div><button type="button" className="primary-button full-button">Giriş yap <ArrowRight /></button></form><p className="auth-switch">Hesabın yok mu? <a href="#">Ücretsiz kayıt ol</a></p></section></main>
  );
}
