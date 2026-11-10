import type { Metadata, Viewport } from "next";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://satgital.com.tr"),
  title: "Satgital — Aradığın ikinci şans burada",
  description: "İkinci el ürünleri kolayca keşfet, ücretsiz ilan ver.",
  icons: {
    icon: [{ url: "/brand/satgital-icon.png", type: "image/png" }],
    shortcut: "/brand/satgital-icon.png",
    apple: "/brand/satgital-icon.png",
  },
  openGraph: {
    title: "Satgital — Aradığın ikinci şans burada",
    description: "İkinci el ürünleri kolayca keşfet, ücretsiz ilan ver.",
    images: [{ url: "/brand/satgital-logo-original.jpg", width: 1024, height: 1024, alt: "Satgital" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        <Header />
        {children}
        <footer className="site-footer">
          <div className="container footer-grid">
            <div><div className="brand footer-brand"><img className="brand-logo" src="/brand/satgital-logo.png" width="859" height="216" alt="Satgital" /></div><p>İkinci elin modern, güvenli ve kolay buluşma noktası.</p></div>
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
