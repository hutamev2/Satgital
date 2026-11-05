# Satgital

Yapay zekâ destekli ikinci el satış platformunun Ferah Modern tasarım prototipi.

## Çalıştırma

```bash
npm install
npm run dev
```

Üretim kontrolü:

```bash
npm run typecheck
npm run build
```

## Güncel kapsam

- Responsive ana sayfa
- İlan listeleme ve filtre arayüzü
- İlan detay ekranları
- İlan verme formu
- Giriş/kayıt görünümü

AI ilan asistanı, tasarım Hutame tarafından onaylandıktan sonra geliştirilecektir.

## Otomatik Netlen yayını

`.github/workflows/deploy-netlen.yml`, `main` dalına gelen her push'ta projeyi derler ve `out/` klasörünü Netlen FTP'ye gönderir.

GitHub deposunda şu Actions secrets tanımlanmalıdır:

- `NETLEN_FTP_SERVER`
- `NETLEN_FTP_USERNAME`
- `NETLEN_FTP_PASSWORD`
- `NETLEN_FTP_SERVER_DIR` (`/public_html/` veya FTP kullanıcısı doğrudan web köküne açılıyorsa `/`)

FTP bilgileri hiçbir zaman kaynak koda yazılmaz.
