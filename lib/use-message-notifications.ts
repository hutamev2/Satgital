"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

export function useMessageNotifications(user: string) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    setCounts({});
    const db = getSupabase();
    if (!db || !user) return;
    let active = true;
    let loading = false;
    let latest: number | undefined;
    let audio: AudioContext | undefined;
    function unlock() {
      try {
        audio ??= new AudioContext();
        void audio.resume().catch(() => {});
      } catch { /* Badge remains available on devices without Web Audio. */ }
    }
    async function load() {
      if (!active || loading) return;
      loading = true;
      try {
        const { data, error } = await db!.rpc("message_notifications");
        if (!active || error || !data) return;
        const next: Record<string, number> = {};
        let newest = 0;
        for (const row of data) {
          next[row.chat_id] = Number(row.unread_count);
          newest = Math.max(newest, Number(row.latest_id));
        }
        setCounts(next);
        if (latest !== undefined && newest > latest && audio?.state === "running") {
          const tone = audio.createOscillator();
          const gain = audio.createGain();
          tone.connect(gain).connect(audio.destination);
          tone.frequency.setValueAtTime(720, audio.currentTime);
          tone.frequency.setValueAtTime(940, audio.currentTime + .09);
          gain.gain.setValueAtTime(.08, audio.currentTime);
          gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .23);
          tone.start(); tone.stop(audio.currentTime + .24);
        }
        latest = Math.max(latest ?? 0, newest);
        window.dispatchEvent(new CustomEvent("satgital:chat-counts", {detail: next}));
      } finally { loading = false; }
    }
    void load();
    const interval = window.setInterval(load, 4000);
    window.addEventListener("satgital:chat-refresh",load);
    window.addEventListener("pointerdown",unlock);
    window.addEventListener("keydown",unlock);
    return () => {
      active = false; clearInterval(interval);
      window.removeEventListener("satgital:chat-refresh",load);
      window.removeEventListener("pointerdown",unlock);
      window.removeEventListener("keydown",unlock);
      if (audio) void audio.close().catch(() => {});
    };
  }, [user]);
  return Object.values(counts).reduce((sum,value) => sum + value, 0);
}
