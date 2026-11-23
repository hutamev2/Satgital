"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, CheckCheck, MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

type Chat = { id: string; listing_id: string | null; title: string; buyer_id: string; updated_at: string };
type Message = { id: number; sender_id: string; body: string; read_at: string | null; created_at: string };
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
      const {data,error} = await db!.from("chat_messages").select("id,sender_id,body,created_at,read_at").eq("chat_id",thread).order("id",{ascending:false}).limit(limit + 1);
      if (!active) return;
      if (error) setError("Mesaj geçmişi yüklenemedi.");
      else { setMore(data.length > limit); setMessages(data.slice(0,limit).reverse()); }
      timer = setTimeout(load,4000);
    }
    void load();
    return () => { active=false; clearTimeout(timer); };
  }, [thread,limit,revision]);

  const historyBox = useRef<HTMLOListElement>(null);
  const stayAtEnd = useRef(true);
  const latestMessage = messages[messages.length - 1]?.id;
  const [unread, setUnread] = useState<Record<string,number>>({});
  useEffect(() => {
    const update = (event: Event) => setUnread((event as CustomEvent<Record<string,number>>).detail);
    window.addEventListener("satgital:chat-counts",update);
    window.dispatchEvent(new Event("satgital:chat-refresh"));
    return () => window.removeEventListener("satgital:chat-counts",update);
  }, [user]);
  useEffect(() => {
    const box = historyBox.current;
    if (box && stayAtEnd.current) box.scrollTop = box.scrollHeight;
  }, [latestMessage, thread]);
  useEffect(() => {
    const db = getSupabase();
    const box = historyBox.current;
    if (!db || !box || !thread) return;
    const visible = new Set<number>();
    let timer: ReturnType<typeof setTimeout>;
    function mark() {
      if (!visible.size || document.hidden || !document.hasFocus()) return;
      const ids = Array.from(visible);
      visible.clear();
      void db!.rpc("mark_messages_read", { thread, message_ids: ids }).then(({error}) => {
        if (!error) window.dispatchEvent(new Event("satgital:chat-refresh"));
      });
    }
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const id = Number((entry.target as HTMLElement).dataset.incoming);
        if (entry.isIntersecting) visible.add(id); else visible.delete(id);
      }
      clearTimeout(timer);
      timer = setTimeout(mark, 180);
    });
    box.querySelectorAll("[data-incoming]").forEach(node => observer.observe(node));
    window.addEventListener("focus",mark);
    document.addEventListener("visibilitychange",mark);
    return () => { clearTimeout(timer); observer.disconnect(); window.removeEventListener("focus",mark); document.removeEventListener("visibilitychange",mark); };
  }, [messages,thread]);

  function choose(chat: Chat) {
    stayAtEnd.current = true;
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
      stayAtEnd.current = true;
      setThread(data); setItem(""); setDraft(""); refresh(n => n + 1);
    } catch { setError("Gönderim doğrulanamadı. Tekrar göndermeden önce sohbeti kontrol et."); }
    finally { lock.current=false; setSending(false); }
  }
  const selected = chats.find(c => c.id === thread);
  const listingId = selected?.listing_id ?? item;
  return <main className="page-shell"><div className="container"><h1>Mesajlarım</h1>
    {error && <p role="alert" className="upload-error">{error}</p>}
    {loading ? <p>Sohbetler yükleniyor…</p> : <div className="chat-layout"><aside aria-label="Sohbetler">
      {chats.map(chat => <button className="chat-choice" aria-pressed={thread === chat.id} disabled={sending} key={chat.id} onClick={() => choose(chat)}><strong>{chat.title} {unread[chat.id] > 0 && <b className="unread-count">{unread[chat.id]}</b>}</strong><small>{chat.buyer_id === user ? "Satıcıyla sohbet" : "Alıcıyla sohbet"} · {time(chat.updated_at)}</small></button>)}
      {!chats.length && !error && <p>Henüz sohbetin yok. Bir ilandan satıcıya mesaj gönderebilirsin.</p>}
    </aside>{(thread || item) ? <section className="conversation"><header><MessageCircle size={22} /><div><h2>{selected?.title || title}</h2>{listingId && <Link href={`/ilan-detay/?id=${listingId}`}>İlanı görüntüle</Link>}</div></header>
      <ol ref={historyBox} className="chat-history" onScroll={e => { const box=e.currentTarget; stayAtEnd.current = box.scrollHeight-box.clientHeight-box.scrollTop < 64; }}>
        {more && <li className="older-messages"><button onClick={() => setLimit(n => n + 50)}>Önceki mesajları göster</button></li>}
        {messages.map(m => {
          const own = m.sender_id === user;
          const receipt = m.read_at ? "Okundu" : "Gönderildi";
          return <li key={m.id} className={own ? "bubble outgoing" : "bubble incoming"} data-incoming={!own && !m.read_at ? m.id : undefined}>
            <p>{m.body}</p><small><time dateTime={m.created_at}>{time(m.created_at)}</time>{own && <span title={receipt} aria-label={receipt} className={m.read_at ? "receipt read" : "receipt"}>{m.read_at ? <CheckCheck size={17}/> : <Check size={15}/>}</span>}</small>
          </li>;
        })}
      </ol>
      <form className="chat-compose" onSubmit={send}><textarea aria-label="Mesajın" placeholder="Mesajını yaz…" rows={2} required maxLength={2000} value={draft} disabled={sending} onChange={e => setDraft(e.target.value)} /><button aria-label="Gönder" disabled={sending || !draft.trim()}><Send size={20}/></button></form>
    </section> : <section className="chat-placeholder"><MessageCircle /><p>Mesajları görmek için bir sohbet seç.</p></section>}</div>}</div></main>;
}
