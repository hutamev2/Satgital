"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

type Estimate = { suggested_price: number | null; sample_count: number; matched_condition: boolean };

function modelFromTitle(title: string) {
  const text = title.toLocaleLowerCase("tr").replaceAll("ı", "i");
  const iphone = text.match(/\biphone\s*(\d{1,2})(?:\s*(pro\s*max|pro|plus|mini|max))?\b/i);
  if (iphone) {
    const capacity = text.match(/\b(32|64|128|256|512|1|2)\s*(gb|tb)\b/);
    return ["iphone", iphone[1], iphone[2]?.replace(/pro\s*max/, "pro max"), capacity?.[0].replace(/\s/g,"")].filter(Boolean).join(" ");
  }
  return title.trim();
}

export function ListingPriceField({ title, condition, hasPhoto, active }: {
  title: string; condition: string; hasPhoto: boolean; active: boolean;
}) {
  const model = modelFromTitle(title);
  const key = JSON.stringify([model,condition,hasPhoto]);
  const [manual, setManual] = useState<string | null>(null);
  const [reply, setReply] = useState<{key:string; estimate?:Estimate; failed?:boolean}>();
  const eligible = hasPhoto && model.length >= 2;
  useEffect(() => {
    if (!eligible || !active) return;
    let live = true;
    const timer = setTimeout(async () => {
      try {
        const db = getSupabase();
        if (!db) throw new Error();
        const {data,error} = await db.rpc("suggest_listing_price",{model_query:model,product_condition:condition || null}).single<Estimate>();
        if (error || !data) throw new Error();
        if (live) setReply({key,estimate:data});
      } catch { if (live) setReply({key,failed:true}); }
    },500);
    return () => { live=false; clearTimeout(timer); };
  },[model,condition,key,eligible,active]);
  const current = reply?.key === key ? reply : undefined;
  const estimate = current?.estimate;
  const price = estimate?.suggested_price;
  return <div><label>Fiyat<div className="input-suffix"><input name="price" required min="1" step="0.01" type="number" placeholder="0" value={manual ?? price ?? ""} onChange={event => setManual(event.target.value)} /><span>TL</span></div></label>
    <small aria-live="polite">{!eligible ? "Fiyat önerisi için fotoğraf ekle ve başlığa marka ile modeli yaz." : !current ? "Benzer ilanlar aranıyor…" : current.failed ? "Fiyat önerisi alınamadı. Fiyatı elle girebilirsin." : price == null ? "Bu model için fiyatı karşılaştırılabilecek ilan bulunamadı." : `${model} · ${estimate?.sample_count} ilan · ${estimate?.matched_condition ? "Aynı ürün durumunda" : "Tüm ürün durumlarında"} ortanca fiyat: ${Number(price).toLocaleString("tr-TR")} TL`}</small>
    {manual !== null && price != null && <button type="button" className="secondary-button" onClick={() => setManual(null)}>Önerilen fiyatı kullan</button>}
  </div>;
}
