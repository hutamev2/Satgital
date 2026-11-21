import { Car, Gamepad2, Home, Laptop, Shirt, Smartphone } from "lucide-react";

export const categoryTree = [
  { id: "telefon", label: "Cep Telefonu", description: "Telefon ve mobil cihazlar", icon: Smartphone, children: ["Yenilenmiş Cep Telefonu", "Yurt Dışı Cep Telefonu", "İkinci El Cep Telefonu", "Tuşlu Telefon", "Cep Telefonu Aksesuarları"] },
  { id: "bilgisayar", label: "Bilgisayar", description: "Bilgisayar ve donanım", icon: Laptop, children: ["Dizüstü Bilgisayar", "Masaüstü Bilgisayar", "Tablet", "Monitör", "Bilgisayar Bileşenleri"] },
  { id: "ev", label: "Ev & Yaşam", description: "Mobilya ve ev eşyaları", icon: Home, children: ["Koltuk & Oturma Grubu", "Masa & Sandalye", "Dolap & Kitaplık", "Beyaz Eşya", "Ev Dekorasyonu"] },
  { id: "giyim", label: "Giyim", description: "Moda ve aksesuar", icon: Shirt, children: ["Kadın Giyim", "Erkek Giyim", "Ayakkabı", "Çanta", "Saat & Aksesuar"] },
  { id: "otomotiv", label: "Otomotiv", description: "Araç ve ekipman", icon: Car, children: ["Otomobil", "Motosiklet", "Jant & Lastik", "Oto Ses & Görüntü", "Yedek Parça"] },
  { id: "oyun", label: "Oyun & Hobi", description: "Konsol, oyun ve koleksiyon", icon: Gamepad2, children: ["Oyun Konsolu", "Konsol Oyunları", "Oyuncu Ekipmanları", "Koleksiyon", "Müzik Aletleri"] },
];

