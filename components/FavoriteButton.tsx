"use client";
import {useEffect,useState} from "react";
import {Heart} from "lucide-react";
import {getSupabase} from "@/lib/supabase";

export function FavoriteButton({id}:{id:string}) {
  const [saved,setSaved]=useState(false);
  const [busy,setBusy]=useState(true);
  useEffect(()=>{
    let current=true;
    const db=getSupabase();
    async function load(){
      if(db && (await db.auth.getSession()).data.session){
        const {data}=await db.from("favorites").select("listing_id").eq("listing_id",id).maybeSingle();
        if(current) setSaved(Boolean(data));
      }
      if(current) setBusy(false);
    }
    void load();
    return ()=>{current=false};
  },[id]);
  async function toggle(){
    const db=getSupabase();
    if(!db)return;
    setBusy(true);
    try{
      if(!(await db.auth.getUser()).data.user){window.location.assign("/giris/?next="+encodeURIComponent(location.pathname+location.search));return;}
      const {error}=saved ? await db.from("favorites").delete().eq("listing_id",id) : await db.from("favorites").insert({listing_id:id});
      if(error && error.code!=="23505") window.alert(error.message);
      else setSaved(!saved);
    }finally{setBusy(false);}
  }
  return <button className="favorite-button" disabled={busy} onClick={toggle} aria-pressed={saved} aria-label={saved?"Favorilerden çıkar":"Favorilere ekle"}><Heart size={19} fill={saved?"currentColor":"none"}/></button>;
}
