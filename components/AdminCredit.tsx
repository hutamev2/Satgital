"use client";
import {useState, type FormEvent} from "react";
import {getSupabase} from "@/lib/supabase";

export function AdminCredit() {
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  async function credit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form=event.currentTarget;
    const values=new FormData(form);
    const recipient=String(values.get("recipient")).trim();
    const amount=Number(values.get("amount"));
    const db=getSupabase();
    if (!db || !window.confirm(recipient+" hesabına "+amount+" TL eklensin mi?")) return;
    setBusy(true);
    try {
      const key="credit:"+recipient+":"+amount;
      const request=sessionStorage.getItem(key) ?? crypto.randomUUID();
      sessionStorage.setItem(key, request);
      const {error}=await db.rpc("market_credit",{recipient,amount,request_id:request});
      if(error) {
        setMessage(error.code==="PGRST202"
          ? "Bakiye servisi üretim veritabanında kurulu değil. restore_market_credit_rpc migration'ını uygulayın."
          : error.message);
        return;
      }
      sessionStorage.removeItem(key);
      form.reset();
      setMessage("Bakiye eklendi.");
    } finally {setBusy(false);}
  }
  return <form className="form-section" onSubmit={credit}><h2>Bakiye tanımla</h2>
    <label>Kullanıcı kimliği (Auth UID)<input required name="recipient" /></label>
    <label>Tutar (TL)<input required name="amount" type="number" min="0.01" step="0.01" /></label>
    <button className="primary-button" disabled={busy}>Bakiye ekle</button><p role="status">{message}</p></form>;
}
