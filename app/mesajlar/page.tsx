"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

type Chat = { id: string; listing_id: string | null; title: string; buyer_id: string; updated_at: string };
type Message = { id: number; sender_id: string; body: string; created_at: string };
const time = (value: string) => new Date(value).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });

export default function MessagesPage() {
  const [user, setUser] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [thread, setThread] = useState("");
  const [item, setItem] = useState("");
  const [title, setTitle] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [limit, setLimit] = useState(50);
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [revision, refresh] = useState(0);
  const lock = useRef(false);

  useEffect(() => {
    const db = getSupabase();
    if (!db) { setError("Mesaj servisine ulaşılamadı."); setLoading(false); return; }
    let active = true;
    const { data: { subscription } } = db.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session) { window.location.replace("/giris/?next=" + encodeURIComponent(location.pathname + location.search)); return; }
      setUser(session.user.id);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const db = getSupabase();
    if (!user || !db) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const listing = new URLSearchParams(location.search).get("ilan");
    async function load(first: boolean) {
      try {
        const { data, error } = await db!.from("listing_chats").select("id,title,listing_id,buyer_id,updated_at").order("updated_at",{ascending:false});
        if (error) throw error;
        if (!active) return;
        const rows: Chat[] = data ?? [];
        setChats(rows);
        if (first && listing) {
          const existing = rows.find(c => c.listing_id === listing && c.buyer_id === user);
          if (existing) setThread(existing.id);
          else {
            const { data: ad } = await db!.from("listings").select("title,seller_id").eq("id",listing).eq("status","published").maybeSingle();
            if (!active) return;
            if (!ad || ad.seller_id === user) setError("Bu ilana mesaj gönderilemez.");
            else { setTitle(ad.title); setItem(listing); }
          }
        }
      } catch { if (active) setError("Sohbetler yüklenemedi."); }
      finally { if (active) { setLoading(false); timer = setTimeout(() => void load(false), 6000); } }
    }
    void load(true);
    return () => { active = false; clearTimeout(timer); };
  }, [user, revision]);

  useEffect(() => {
    const db = getSupabase();
    if (!thread || !db) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      const {data,error} = await db!.from("chat_messages").select("id,sender_id,body,created_at").eq("chat_id",thread).order("id",{ascending:false}).limit(limit + 1);
      if (!active) return;
      if (error) setError("Mesaj geçmişi yüklenemedi.");
      else { setMore(data.length > limit); setMessages(data.slice(0,limit).reverse()); }
      timer = setTimeout(load,4000);
    }
    void load();
    return () => { active=false; clearTimeout(timer); };
  }, [thread,limit,revision]);

  function choose(chat: Chat) {
    history.replaceState(null,"","/mesajlar/");
    setThread(chat.id); setTitle(chat.title); setItem(""); setDraft(""); setError(""); setMessages([]); setMore(false); setLimit(50);
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    const db = getSupabase();
    if (!db || lock.current || !draft.trim()) return;
    lock.current = true; setSending(true); setError("");
    try {
      const {data,error} = await db.rpc("send_listing_message",{item:thread ? null : item,thread:thread || null,message:draft.trim()});
      if (error) throw error;
      history.replaceState(null,"","/mesajlar/");
      setThread(data); setItem(""); setDraft(""); refresh(n => n + 1);
    } catch { setError("Gönderim doğrulanamadı. Tekrar göndermeden önce sohbeti kontrol et."); }
    finally { lock.current=false; setSending(false); }
  }
  const selected = chats.find(c => c.id === thread);
  const listingId = selected?.listing_id ?? item;
  return <main className="page-shell"><div className="container"><h1>Mesajlarım</h1>
    {error && <p role="alert" className="upload-error">{error}</p>}
    {loading ? <p>Sohbetler yükleniyor…</p> : <div className="chat-layout"><aside aria-label="Sohbetler">
      {chats.map(chat => <button className="chat-choice" aria-pressed={thread === chat.id} disabled={sending} key={chat.id} onClick={() => choose(chat)}><strong>{chat.title}</strong><small>{chat.buyer_id === user ? "Satıcıyla sohbet" : "Alıcıyla sohbet"} · {time(chat.updated_at)}</small></button>)}
      {!chats.length && !error && <p>Henüz sohbetin yok. Bir ilandan satıcıya mesaj gönderebilirsin.</p>}
    </aside>{(thread || item) && <section className="form-section"><h2>{selected?.title || title}</h2>{listingId && <Link href={`/ilan-detay/?id=${listingId}`}>İlanı gör</Link>}
      {more && <button onClick={() => setLimit(n => n + 50)}>Önceki mesajları göster</button>}
      <ol className="chat-history">{messages.map(m => <li key={m.id}><small>{m.sender_id === user ? "Sen" : selected?.buyer_id === user ? "Satıcı" : "Alıcı"} · {time(m.created_at)}</small><p>{m.body}</p></li>)}</ol>
      <form className="sell-form" onSubmit={send}><label>Mesajın<textarea rows={3} required maxLength={2000} value={draft} disabled={sending} onChange={e => setDraft(e.target.value)} /></label><button className="primary-button" disabled={sending || !draft.trim()}>{sending ? "Gönderiliyor…" : "Gönder"}</button></form>
    </section>}</div>}</div></main>;
}
