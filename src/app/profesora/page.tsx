"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Trash2, Shuffle, Play, Pause, Headphones, CalendarDays, RefreshCw } from "lucide-react";

type AudioItem = { id: string; child_name: string; sender_name: string | null; created_at: string; duration_seconds: number | null; };
export default function TeacherPage() {
  const [items, setItems] = useState<AudioItem[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [queue, setQueue] = useState<AudioItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [randomMode, setRandomMode] = useState(false);
  const [src, setSrc] = useState("");
  const [busy, setBusy] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null);

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/audios", { cache: "no-store" });
      if (!res.ok) throw new Error("No se ha podido cargar la lista.");
      setItems(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Error inesperado."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const list = items.filter(x => x.child_name.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")));
    return list.sort((a,b) => sort === "name" ? a.child_name.localeCompare(b.child_name, "es") : sort === "oldest" ? +new Date(a.created_at)-+new Date(b.created_at) : +new Date(b.created_at)-+new Date(a.created_at));
  }, [items, query, sort]);

  async function play(item: AudioItem) {
    setBusy(item.id); setError("");
    try {
      const res = await fetch(`/api/audios/${item.id}/url`);
      if (!res.ok) throw new Error("No se ha podido abrir el audio.");
      const data = await res.json();
      setSrc(data.url); setActive(item.id);
      setTimeout(() => audio.current?.play().catch(() => {}), 100);
    } catch (e) { setError(e instanceof Error ? e.message : "Error al reproducir."); }
    finally { setBusy(""); }
  }

  async function remove(item: AudioItem) {
    if (!window.confirm(`¿Eliminar definitivamente el audio de ${item.child_name}?`)) return;
    setBusy(item.id);
    const res = await fetch(`/api/audios/${item.id}`, { method: "DELETE" });
    setBusy("");
    if (res.ok) { setItems(old => old.filter(x => x.id !== item.id)); if (active === item.id) { setActive(null); setSrc(""); } }
    else setError("No se ha podido eliminar el audio.");
  }

  function playRandom() {
    if (!items.length) return;
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setQueue(shuffled); setQueueIndex(0); setRandomMode(true); play(shuffled[0]);
  }
  function nextInQueue() {
    const next = queueIndex + 1;
    if (next < queue.length) { setQueueIndex(next); play(queue[next]); }
    else { setRandomMode(false); setQueue([]); setActive(null); setSrc(""); }
  }

  return <main className="teacher-page">
    <header className="topbar"><Link href="/" className="back-link"><ArrowLeft size={18}/> Familias</Link><div className="teacher-title"><Headphones size={20}/> Panel del aula</div><button className="icon-button" onClick={load} aria-label="Actualizar"><RefreshCw size={18}/></button></header>
    <section className="teacher-hero"><p className="eyebrow">ESPACIO DE LA PROFESORA</p><h1>Pequeños mensajes,<br/><em>grandes abrazos.</em></h1><p>Un rincón para escuchar, acompañar y compartir los mensajes de las familias.</p></section>
    <section className="teacher-content">
      <div className="stats-row"><div className="stat-card"><strong>{items.length}</strong><span>audios recibidos</span></div><button className="random-button" onClick={playRandom} disabled={!items.length}><Shuffle size={18}/> Reproducir aleatoriamente</button></div>
      {randomMode && <div className="queue-note">Reproducción aleatoria · {queueIndex + 1} de {queue.length} <button onClick={() => {setRandomMode(false); setQueue([]); setActive(null); setSrc("");}}>Detener lista</button></div>}
      {active && <div className="now-playing"><div><span>SONANDO AHORA</span><strong>{items.find(x => x.id === active)?.child_name || "Audio"}</strong></div><audio ref={audio} src={src} controls autoPlay onEnded={randomMode ? nextInQueue : undefined}/></div>}
      <div className="tools-row"><div className="search-box"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre del niño o niña"/></div><select value={sort} onChange={e => setSort(e.target.value)} aria-label="Ordenar audios"><option value="newest">Más recientes</option><option value="oldest">Más antiguos</option><option value="name">Nombre (A–Z)</option></select></div>
      {error && <div className="notice error">{error}</div>}
      {loading ? <p className="empty">Cargando audios…</p> : filtered.length === 0 ? <div className="empty"><Headphones size={30}/><strong>{items.length ? "No hay resultados" : "Todavía no hay audios"}</strong><span>Los mensajes que envíen las familias aparecerán aquí.</span></div> :
        <div className="audio-list">{filtered.map(item => <article className="audio-item" key={item.id}>
          <div className="audio-avatar">{item.child_name.trim().charAt(0).toUpperCase()}</div>
          <div className="audio-info"><strong>{item.child_name}</strong><span>{item.sender_name ? `De: ${item.sender_name} · ` : ""}{new Date(item.created_at).toLocaleString("es-ES", {dateStyle:"medium", timeStyle:"short"})}</span></div>
          <button className="play-button" onClick={() => play(item)} disabled={busy === item.id} aria-label={`Reproducir audio de ${item.child_name}`}>{busy === item.id ? "…" : <Play size={18} fill="currentColor"/>}</button>
          <button className="delete-button" onClick={() => remove(item)} disabled={busy === item.id} aria-label={`Eliminar audio de ${item.child_name}`}><Trash2 size={18}/></button>
        </article>)}</div>}
    </section>
    <footer>Uso del equipo educativo · Voces que acompañan</footer>
  </main>;
}
