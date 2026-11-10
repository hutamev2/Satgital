"use client";
import {useMemo,useState, type FormEvent} from "react";
import {CheckCircle2,Search,UserRound,WalletCards} from "lucide-react";
import {getSupabase} from "@/lib/supabase";

export type CreditUser={id:string;display_name:string;phone:string|null};

export function AdminCredit({users}:{users:CreditUser[]}) {
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [query,setQuery]=useState("");
  const [selected,setSelected]=useState("");
  const [amount,setAmount]=useState("");
  const matches=useMemo(()=>{
    const needle=query.trim().toLocaleLowerCase("tr-TR");
    return users.filter(user=>!needle||user.display_name.toLocaleLowerCase("tr-TR").includes(needle)||user.phone?.includes(needle)||user.id.includes(needle)).slice(0,8);
  },[query,users]);
  const selectedUser=users.find(user=>user.id===selected);
  async function credit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form=event.currentTarget;
    const values=new FormData(form);
    const recipient=String(values.get("recipient")).trim();
    const creditAmount=Number(values.get("amount"));
    const db=getSupabase();
    if (!db || !selectedUser || !window.confirm(selectedUser.display_name+" hesabına "+creditAmount.toLocaleString("tr-TR")+" TL eklensin mi?")) return;
    setBusy(true);
    try {
      const key="credit:"+recipient+":"+creditAmount;
      const request=sessionStorage.getItem(key) ?? crypto.randomUUID();
      sessionStorage.setItem(key, request);
      const {error}=await db.rpc("market_credit",{recipient,amount:creditAmount,request_id:request});
      if(error) {
        setMessage(error.code==="PGRST202"
          ? "Bakiye servisi üretim veritabanında kurulu değil. restore_market_credit_rpc migration'ını uygulayın."
          : error.message);
        return;
      }
      sessionStorage.removeItem(key);
      form.reset();
      setAmount("");
      setMessage(selectedUser.display_name+" hesabına bakiye eklendi.");
    } finally {setBusy(false);}
  }
  return <section className="admin-credit-card"><div className="admin-card-heading"><span><WalletCards/></span><div><small>BAKİYE YÖNETİMİ</small><h2>Kullanıcıya bakiye yükle</h2><p>Listeden kullanıcıyı seç, yüklenecek tutarı gir ve güvenle onayla.</p></div></div>
    <form onSubmit={credit}><div className="admin-user-picker"><label htmlFor="admin-user-search">Kullanıcı seç</label><div className="admin-search"><Search/><input id="admin-user-search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="İsim, telefon veya kullanıcı kimliği ara"/></div>
      <div className="admin-user-results">{matches.map(user=><button key={user.id} type="button" className={selected===user.id?"selected":""} onClick={()=>{setSelected(user.id);setMessage("")}}><span><UserRound/></span><div><strong>{user.display_name}</strong><small>{user.phone||"Telefon eklenmemiş"}</small></div>{selected===user.id&&<CheckCircle2/>}</button>)}{!matches.length&&<p>Kullanıcı bulunamadı.</p>}</div>
    </div><input type="hidden" name="recipient" value={selected}/><div className="admin-credit-action"><label htmlFor="credit-amount">Yüklenecek tutar</label><div className="admin-amount-input"><input id="credit-amount" required name="amount" type="number" min="0.01" step="0.01" value={amount} onChange={event=>setAmount(event.target.value)} placeholder="0,00"/><span>TL</span></div><button className="primary-button" disabled={busy||!selected||!amount}>{busy?"Yükleniyor…":"Bakiyeyi yükle"}</button>{selectedUser&&<p className="admin-selected-user"><CheckCircle2/> {selectedUser.display_name} seçildi</p>}{message&&<p className={message.includes("eklendi")?"admin-credit-success":"upload-error"} role="status">{message}</p>}</div></form>
  </section>;
}
