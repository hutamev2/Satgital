import type { Metadata } from "next";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Satgital — Aradığın ikinci şans burada",
  description: "İkinci el ürünleri kolayca keşfet, ücretsiz ilan ver.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        <Header />
        {children}
        <footer className="site-footer">
          <div className="container footer-grid">
            <div><div className="brand footer-brand">satgital<span>.</span></div><p>İkinci elin modern, güvenli ve kolay buluşma noktası.</p></div>
            <div><strong>Satgital</strong><LinkList items={["Hakkımızda", "Nasıl Çalışır?", "Güvenli Alışveriş"]} /></div>
            <div><strong>Destek</strong><LinkList items={["Yardım Merkezi", "Kullanım Koşulları", "Gizlilik"]} /></div>
          </div>
          <div className="container footer-bottom">© 2026 Satgital. Tasarım prototipi.</div>
        </footer>
      </body>
    </html>
  );
}

function LinkList({ items }: { items: string[] }) {
  return <ul>{items.map((item) => <li key={item}><a href="#">{item}</a></li>)}</ul>;
}
