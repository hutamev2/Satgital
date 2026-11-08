"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {getSupabase} from "@/lib/supabase";

type Favorite={listing_id:string;title:string;price:number;status:string};
export default function Favorites(){
  const [rows,setRows]=useState<Favorite[]>([]);
  const [message,setMessage]=useState("Yükleniyor…");
  useEffect(()=>{void (async()=>{
    const db=getSupabase();
    if(!db){setMessage("Bağlantı kurulamadı.");return;}
    const {data:{user}}=await db.auth.getUser();
    if(!user){window.location.replace("/giris/?next=/favorilerim/");return;}
    const {data,error}=await db.from("favorites").select("listing_id,title,price,status").eq("user_id",user.id).order("created_at",{ascending:false});
    setRows(data??[]);setMessage(error?.message??"");
  })()},[]);
  async function remove(id:string){
    const db=getSupabase();
    if(!db)return;
    const {error}=await db.from("favorites").delete().eq("listing_id",id);
    if(error)setMessage(error.message);
    else setRows(rows=>rows.filter(row=>row.listing_id!==id));
  }
  return <main className="page-shell"><div className="container"><h1>Favorilerim</h1>
    {message && <p role="status">{message}</p>}
    {!message && !rows.length && <div className="my-listings-empty"><h2>Henüz favori ilanın yok.</h2><Link href="/ilanlar">İlanları keşfet</Link></div>}
    {rows.map(row=><article className="form-section" key={row.listing_id}><h2>{row.title}</h2><p>{row.price} TL · {row.status==="sold"?"Satıldı":row.status==="published"?"Yayında":"Yayında değil"}</p>
    {row.status==="published" && <Link className="manage-button" href={"/ilan-detay/?id="+row.listing_id}>İlana git</Link>} <button className="manage-button" onClick={()=>remove(row.listing_id)}>Favorilerden çıkar</button></article>)}</div></main>;
}
