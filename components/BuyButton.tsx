"use client";
import {useState} from "react";
import type {Listing} from "@/lib/data";
import {getSupabase} from "@/lib/supabase";

export function BuyButton({listing}: {listing: Listing}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function buy() {
    const db = getSupabase();
    if (!db) { setMessage("Bağlantı kurulamadı."); return; }
    if (!window.confirm(listing.price + " bakiyenden bloke edilecek. Satın almayı onaylıyor musun?")) return;
    setBusy(true);
    try {
      const {data} = await db.auth.getUser();
      if (!data.user) { window.location.assign("/giris/?next="+encodeURIComponent(location.pathname+location.search)); return; }
      const {error} = await db.rpc("market_buy",{item:listing.id,expected_price:listing.amount});
      if (error) setMessage(error.message);
      else window.location.assign("/aldigim-ilanlar/");
    } finally {setBusy(false);}
  }
  return <><button className="primary-button full-button" disabled={busy} onClick={buy}>Satın al · {listing.price}</button><p role="status">{message}</p></>;
}
