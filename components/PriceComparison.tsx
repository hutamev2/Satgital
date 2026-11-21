"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";

const sources = ["Satgital", "Sahibinden", "Letgo", "Dolap"];
const currency = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
type Quote = { source: string; sample_count: number; average_price: number; lowest_price: number; highest_price: number };
type Detector = new () => { detect(image: ImageBitmap): Promise<{ rawValue: string }[]> };

export function PriceComparison({ photo }: { photo?: File }) {
  const [file, setFile] = useState<File>();
  const [model, setModel] = useState("");
  const [manual, setManual] = useState<Record<string, string>>({});
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [searched, setSearched] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  async function readLabel() {
    const image = photo ?? file;
    if (!image) return;
    const TextDetector = (window as Window & { TextDetector?: Detector }).TextDetector;
    if (!TextDetector) {
      setMessage("Bu tarayıcı fotoğraftan metin okumayı desteklemiyor. Etiketteki marka ve modeli yazabilirsin.");
      return;
    }
    setBusy(true);
    let bitmap: ImageBitmap | undefined;
    try {
      bitmap = await createImageBitmap(image);
      const lines = await new TextDetector().detect(bitmap);
      const text = lines.map(line => line.rawValue.trim()).filter(Boolean).join(" ").slice(0,100);
      if (text) { setModel(text); setSearched(""); }
      setMessage(text ? "Okunan metni kontrol edip yalnızca marka ve modeli bırak." : "Etikette okunabilir metin bulunamadı.");
    } catch { setMessage("Fotoğraf okunamadı. Modeli elle girebilirsin."); }
    finally { bitmap?.close(); setBusy(false); }
  }

  async function compare() {
    const query = model.trim();
    if (query.length < 2 || busy) return;
    setBusy(true);
    setFailed(false);
    setMessage("");
    setQuotes([]);
    setSearched("");
    try {
      const db = getSupabase();
      if (!db) throw new Error();
      const { data, error } = await db.rpc("compare_market_sources", { model_query: query });
      if (error) throw error;
      setQuotes(data ?? []);
    } catch { setFailed(true); }
    finally { setSearched(query); setBusy(false); }
  }

  return <section className="form-section comparison">
    <p>Fotoğraftaki etiketi okut veya model adını yaz. Satgital için yayındaki ilanlar, diğer kaynaklar için son yedi günde aktarılan fiyatlar kullanılır.</p>
    {!photo && <label>Ürün etiketi fotoğrafı<input type="file" accept="image/*" disabled={busy} onChange={e => setFile(e.target.files?.[0])} /></label>}
    {(photo || file) && <button type="button" className="secondary-button" disabled={busy} onClick={readLabel}>Fotoğraftaki yazıyı oku</button>}
    <label>Marka ve model<input maxLength={100} value={model} disabled={busy} placeholder="Örn. iPhone 13 128 GB" onChange={e => { setModel(e.target.value); setSearched(""); setManual({}); }} /></label>
    <button type="button" className="primary-button" onClick={compare} disabled={busy || model.trim().length < 2}>{busy ? "İşleniyor…" : "Fiyatları karşılaştır"}</button>
    <div aria-live="polite">{message}</div>
    {searched && <div><h3>{searched}</h3>{failed && <p role="alert">Fiyat veritabanına ulaşılamadı. Dış ilanlardan gördüğün fiyatları aşağıya girebilirsin.</p>}
      {sources.map(source => {
        const row = quotes.find(quote => quote.source === source);
        return <section className="comparison-source" key={source}><h4>{source}</h4>
          {row ? <p>{row.sample_count} ilanda ortalama <strong>{currency.format(row.average_price)}</strong> · {currency.format(row.lowest_price)} – {currency.format(row.highest_price)}</p> : <p>{failed ? "Veri alınamadı." : "Eşleşen güncel ilan bulunamadı."}</p>}
          {source !== "Satgital" && <label>Gördüğün ilan fiyatı (TL)<input type="number" min="0.01" step="0.01" value={manual[source] ?? ""} onChange={e => setManual({ ...manual, [source]: e.target.value })} /></label>}
          {Number(manual[source]) > 0 && <p>Senin girdiğin fiyat <strong>{currency.format(Number(manual[source]))}</strong></p>}
        </section>;
      })}
    </div>}
  </section>;
}
