"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ImageOff, Search, ShoppingBag } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

type HistoryMode = "bought" | "sold";
const orderLabels: Record<string,string> = {
  pending:"Satıcı onayı bekleniyor", accepted:"Teslim onayı bekleniyor", completed:"Tamamlandı", cancelled:"İptal edildi", rejected:"Satıcı reddetti"
};
type Order={id:string; listing_id:string; title:string; amount:number; status:string; cover_path:string|null; imageUrl?:string; created_at:string};
type ImageRow = { object_path: string; sort_order: number };
type SoldListing = {
  id: string;
  title: string;
  price: number | string;
  city: string;
  created_at: string;
  listing_images: ImageRow[] | null;
  imageUrl: string | null;
};

const pageCopy = {
  bought: {
    kicker: "Alışverişlerim",
    title: "Aldığım İlanlar",
    description: "Satın aldığın ilanları ve işlem geçmişini buradan takip et.",
    emptyTitle: "Satın aldığınız ilan bulunmamaktadır.",
    emptyText: "İhtiyacın olan ürünü güvenle bulmak için ilanları keşfet.",
  },
  sold: {
    kicker: "Satışlarım",
    title: "Sattığım İlanlar",
    description: "Satışını tamamladığın ilanları fotoğraflarıyla görüntüle.",
    emptyTitle: "Sattığınız ilan bulunmamaktadır.",
    emptyText: "Bir ilan satıldı olarak işaretlendiğinde burada görünecek.",
  },
} satisfies Record<HistoryMode, Record<string, string>>;

export function ListingHistoryPage({ mode }: { mode: HistoryMode }) {
  const copy = pageCopy[mode];
  const [orders,setOrders]=useState<Order[]>([]);
  const [revision,setRevision]=useState(0);
  const [busy,setBusy]=useState(false);
  async function transition(id:string,action:string) {
    const db=getSupabase();
    if(!db)return;
    if(action==="confirm" && !window.confirm("Ürünü teslim aldın mı? Onayladığında bloke tutar satıcıya aktarılacak."))return;
    setBusy(true);
    try{
      const {error}=await db.rpc("market_transition",{order_id:id,action});
      if(error)setNotice(error.message);
      else {setNotice("");setRevision(n=>n+1);}
    }finally{setBusy(false);}
  }
  const [listings, setListings] = useState<SoldListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) { setNotice("Hesap bağlantısı kurulamadı."); setLoading(false); return; }
    void (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { window.location.replace("/giris/"); return; }
        const history=await supabase.from("market_orders").select("id,listing_id,title,amount,status,cover_path,created_at")
          .eq(mode==="bought"?"buyer_id":"seller_id",user.id).order("created_at",{ascending:false});
        if(history.error) throw new Error(history.error.message);
        const sales=await Promise.all((history.data??[]).map(async order=>{
          const cover=order.cover_path && await supabase.storage.from("listing-images").createSignedUrl(order.cover_path,3600);
          return {...order,imageUrl:cover?.data?.signedUrl};
        }));
        setOrders(sales);
        if (mode === "bought") { setListings([]); return; }

        const { data, error } = await supabase
          .from("listings")
          .select("id,title,price,city,created_at,listing_images(object_path,sort_order)")
          .eq("seller_id", user.id)
          .eq("status", "sold")
          .order("created_at", { ascending: false });
        if (error) throw error;

        const rows = (data ?? []) as unknown as Omit<SoldListing, "imageUrl">[];
        const mapped = await Promise.all(rows.map(async (listing) => {
          const imagePath = [...(listing.listing_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.object_path;
          if (!imagePath) return { ...listing, imageUrl: null };
          const { data: signed } = await supabase.storage.from("listing-images").createSignedUrl(imagePath, 3_600);
          return { ...listing, imageUrl: signed?.signedUrl ?? null };
        }));
        setListings(mapped.filter(row=>!history.data?.some(order=>order.listing_id===row.id && order.status==="completed")));
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "İlan geçmişi yüklenemedi.");
      } finally {
        setLoading(false);
      }
    })();
  }, [mode,revision]);

  return <main className="page-shell my-listings-page"><div className="container">
    <div className="my-listings-header"><div className="page-intro"><span className="section-kicker">{copy.kicker}</span><h1>{copy.title}</h1><p>{copy.description}</p></div><Link className="primary-button" href="/ilanlar"><Search size={18}/> İlanları keşfet</Link></div>
    {notice && <p className="form-note" role="status">{notice}</p>}
    {orders.map(order=><article className="form-section" key={order.id}>
      {order.imageUrl && <img width={140} alt={order.title} src={order.imageUrl}/>}<h2>{order.title}</h2><p>{Number(order.amount).toLocaleString("tr-TR")} TL · {orderLabels[order.status]} · {new Date(order.created_at).toLocaleDateString("tr-TR")}</p>
      {mode==="sold" && order.status==="pending" && <button className="manage-button" disabled={busy} onClick={()=>transition(order.id,"accept")}>Kabul et</button>}
      {mode==="sold" && ["pending","accepted"].includes(order.status) && <button className="manage-button" disabled={busy} onClick={()=>transition(order.id,"reject")}>Reddet ve iade et</button>}
      {mode==="bought" && order.status==="pending" && <button className="manage-button" disabled={busy} onClick={()=>transition(order.id,"cancel")}>İptal et</button>}
      {mode==="bought" && order.status==="accepted" && <button className="primary-button" disabled={busy} onClick={()=>transition(order.id,"confirm")}>Teslim aldım</button>}
    </article>)}
    {loading ? <div className="my-listings-empty"><p>İlan geçmişiniz yükleniyor...</p></div> : listings.length === 0 && (notice || orders.length>0) ? null : listings.length === 0 ? <div className="my-listings-empty">{mode === "bought" ? <ShoppingBag/> : <CheckCircle2/>}<h2>{copy.emptyTitle}</h2><p>{copy.emptyText}</p><Link className="primary-button" href={mode === "bought" ? "/ilanlar" : "/ilanlarim"}>{mode === "bought" ? <Search size={18}/> : <CheckCircle2 size={18}/>} {mode === "bought" ? "İlanları keşfet" : "İlanlarıma git"}</Link></div> : <>
      <div className="listing-filters history-filter" aria-label="Satılan ilan özeti"><button className="active" type="button" aria-pressed="true">Tümü <span>{listings.length}</span></button></div>
      <div className="managed-listing-grid">{listings.map((listing) => <article className="managed-listing-card" key={listing.id}>
        <div className="managed-listing-image">{listing.imageUrl ? <img src={listing.imageUrl} alt={listing.title}/> : <ImageOff/>}<span className="listing-status status-sold">Satıldı</span></div>
        <div className="managed-listing-body"><div><h2>{listing.title}</h2><p>{listing.city} · {new Intl.DateTimeFormat("tr-TR").format(new Date(listing.created_at))}</p></div><strong>{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(listing.price))}</strong><div className="history-complete"><CheckCircle2/> Satış tamamlandı</div></div>
      </article>)}</div>
    </>}
  </div></main>;
}
