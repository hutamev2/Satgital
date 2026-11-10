"use client";
import {useEffect,useState} from "react";
import {CheckCircle2,ChevronRight,LockKeyhole,ShoppingBag,WalletCards,X} from "lucide-react";
import type {Listing} from "@/lib/data";
import {getSupabase} from "@/lib/supabase";

export function BuyButton({listing}: {listing: Listing}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [open,setOpen]=useState(false);
  const [balance,setBalance]=useState<number|null>(null);
  const [userId,setUserId]=useState<string|null>(null);
  const [complete,setComplete]=useState(false);
  const amount=listing.amount??0;
  const ownListing=Boolean(userId&&listing.sellerId===userId);
  const insufficient=balance!==null&&balance<amount;

  useEffect(()=>{
    if(!open)return;
    const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape"&&!busy)setOpen(false)};
    document.body.classList.add("purchase-open");
    window.addEventListener("keydown",onKey);
    return()=>{document.body.classList.remove("purchase-open");window.removeEventListener("keydown",onKey)};
  },[open,busy]);

  async function showCheckout(){
    const db=getSupabase();
    if(!db){setMessage("Bağlantı kurulamadı.");return;}
    const {data:{user}}=await db.auth.getUser();
    if(!user){window.location.assign("/giris/?next="+encodeURIComponent(location.pathname+location.search));return;}
    setUserId(user.id);setMessage("");setOpen(true);
    const {data,error}=await db.from("account_balances").select("balance").eq("user_id",user.id).maybeSingle();
    if(error)setMessage("Bakiye bilgisi alınamadı.");
    else setBalance(Number(data?.balance??0));
  }
  async function buy() {
    const db = getSupabase();
    if (!db) { setMessage("Bağlantı kurulamadı."); return; }
    setBusy(true);
    try {
      const {data} = await db.auth.getUser();
      if (!data.user) { window.location.assign("/giris/?next="+encodeURIComponent(location.pathname+location.search)); return; }
      const {error} = await db.rpc("market_buy",{item:listing.id,expected_price:listing.amount});
      if (error) setMessage(error.message.includes("Yetersiz")?"Bakiyen bu satın alma için yetersiz.":error.message);
      else setComplete(true);
    } finally {setBusy(false);}
  }
  return <><button className="primary-button full-button buy-trigger" onClick={showCheckout}><ShoppingBag size={19}/> Hemen Satın Al</button>{message&&!open&&<p className="purchase-inline-message" role="status">{message}</p>}
  {open&&<div className="purchase-layer" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)setOpen(false)}}><section className="purchase-drawer" role="dialog" aria-modal="true" aria-labelledby="purchase-title">
    <header><div><span className="section-kicker">Güvenli ödeme</span><h2 id="purchase-title">{complete?"Satın alma talebin alındı":"Satın almayı tamamla"}</h2></div><button onClick={()=>setOpen(false)} disabled={busy} aria-label="Kapat"><X/></button></header>
    {complete?<div className="purchase-success"><span><CheckCircle2/></span><h3>Harika seçim!</h3><p><strong>{listing.title}</strong> için tutar güvenli biçimde bloke edildi. Satıcının onayını Aldığım İlanlar’dan takip edebilirsin.</p><a className="primary-button full-button" href="/aldigim-ilanlar/">Aldığım İlanlara Git <ChevronRight/></a></div>:<>
      <div className="purchase-product"><img src={listing.image} alt=""/><div><small>Satın aldığın ürün</small><strong>{listing.title}</strong><span>{listing.price}</span></div></div>
      <div className="purchase-summary"><div><span>Ürün bedeli</span><strong>{listing.price}</strong></div><div><span>Hizmet bedeli</span><strong>Ücretsiz</strong></div><div className="purchase-total"><span>Toplam</span><strong>{listing.price}</strong></div></div>
      <div className={`purchase-balance${insufficient?" insufficient":""}`}><WalletCards/><div><span>Satgital bakiyen</span><strong>{balance===null?"Kontrol ediliyor…":balance.toLocaleString("tr-TR",{style:"currency",currency:"TRY"})}</strong></div></div>
      {ownListing&&<p className="purchase-alert">Kendi ilanını satın alamazsın.</p>}{insufficient&&<p className="purchase-alert">Bu işlem için bakiyende {(amount-(balance??0)).toLocaleString("tr-TR",{style:"currency",currency:"TRY"})} daha olmalı.</p>}{message&&<p className="purchase-alert" role="status">{message}</p>}
      <button className="primary-button full-button purchase-confirm" disabled={busy||balance===null||insufficient||ownListing} onClick={buy}>{busy?<span className="purchase-spinner"/>:<LockKeyhole size={18}/>} {busy?"İşlem güvenle tamamlanıyor…":"Satın Almayı Onayla"}</button>
      <p className="purchase-assurance"><LockKeyhole/> Tutar satıcıya hemen aktarılmaz; teslimatı onaylayana kadar emanet bakiyede tutulur.</p>
    </>}
  </section></div>}</>;
}
