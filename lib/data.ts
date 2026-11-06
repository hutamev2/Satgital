export type Listing = {
  id: string;
  title: string;
  price: string;
  location: string;
  category: string;
  condition: string;
  posted: string;
  image: string;
  description: string;
  href?: string;
};

export const listings: Listing[] = [
  {
    id: "ikili-koltuk",
    title: "İskandinav İkili Koltuk",
    price: "8.750 TL",
    location: "İstanbul, Kadıköy",
    category: "Mobilya & Ev Eşyası",
    condition: "Çok iyi",
    posted: "Bugün",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=88",
    description: "Az kullanılmış, lekesiz ve sağlam İskandinav tarzı ikili koltuk. Yeni eve taşındığım için satıyorum.",
  },
  {
    id: "macbook-air",
    title: "MacBook Air M1 256 GB",
    price: "21.500 TL",
    location: "Ankara, Çankaya",
    category: "Bilgisayar",
    condition: "Çok iyi",
    posted: "1 saat önce",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=88",
    description: "Pil sağlığı yüksek, kutulu ve temiz kullanılmış MacBook Air. Şarj adaptörü dahildir.",
  },
  {
    id: "sehir-bisikleti",
    title: "Şehir Bisikleti 28 Jant",
    price: "6.200 TL",
    location: "İzmir, Karşıyaka",
    category: "Spor & Outdoor",
    condition: "İyi",
    posted: "3 saat önce",
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=88",
    description: "Bakımları yeni yapıldı. Şehir içi kullanım için hafif ve konforlu bisiklet.",
  },
  {
    id: "fotograf-makinesi",
    title: "Aynasız Fotoğraf Makinesi",
    price: "17.900 TL",
    location: "Bursa, Nilüfer",
    category: "Elektronik",
    condition: "Çok iyi",
    posted: "Dün",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=88",
    description: "Hobi amaçlı kullanıldı. Lens, çanta ve yedek batarya ile birlikte verilecektir.",
  },
  {
    id: "kitaplik",
    title: "Masif Ahşap Kitaplık",
    price: "4.300 TL",
    location: "Antalya, Muratpaşa",
    category: "Mobilya & Ev Eşyası",
    condition: "İyi",
    posted: "Dün",
    image: "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=1200&q=88",
    description: "Masif çam ağacından, sağlam ve geniş raflı kitaplık. Demonte edilebilir.",
  },
  {
    id: "oyun-konsolu",
    title: "Oyun Konsolu + 2 Kol",
    price: "18.250 TL",
    location: "İstanbul, Beşiktaş",
    category: "Oyun & Konsol",
    condition: "Çok iyi",
    posted: "2 gün önce",
    image: "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?auto=format&fit=crop&w=1200&q=88",
    description: "Sorunsuz çalışan oyun konsolu. İki orijinal kol ve kutusu ile teslim edilecektir.",
  },
];

export const categories = [
  "Mobilya & Ev Eşyası",
  "Elektronik",
  "Telefon & Aksesuar",
  "Giyim & Aksesuar",
  "Kitap & Hobi",
  "Bebek & Çocuk",
  "Spor & Outdoor",
  "Otomotiv",
];
