"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Mic, Square, Play, Pause, Send, Heart, Headphones, CheckCircle2 } from "lucide-react";

const MAX_SECONDS = 10 * 60;

export default function Home() {
  const [child, setChild] = useState("");
  const [sender, setSender] = useState("");
  const [consent, setConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [playing, setPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function clearTimer() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }

  async function startRecording() {
    setMessage("");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMessage("Tu navegador no permite grabar audio. Prueba con Chrome o Safari actualizado.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "";
      const media = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorder.current = media;
      media.ondataavailable = e => { if (e.data.size) chunks.current.push(e.data); };
      media.onstop = () => {
        const result = new Blob(chunks.current, { type: media.mimeType || "audio/webm" });
        setBlob(result);
        setPreviewUrl(URL.createObjectURL(result));
        stream.getTracks().forEach(track => track.stop());
      };
      media.start();
      setRecording(true);
      setSeconds(0);
      timer.current = setInterval(() => {
        setSeconds(old => {
          if (old + 1 >= MAX_SECONDS) {
            clearTimer();
            if (recorder.current?.state === "recording") recorder.current.stop();
            setRecording(false);
            return MAX_SECONDS;
          }
          return old + 1;
        });
      }, 1000);
    } catch {
      setMessage("No se ha podido acceder al micrófono. Comprueba los permisos del navegador.");
    }
  }

  function stopRecording() {
    clearTimer();
    if (recorder.current?.state === "recording") recorder.current.stop();
    setRecording(false);
  }

  function resetAudio() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(""); setBlob(null); setSeconds(0); setPlaying(false);
  }

  function sendAudio() {
    if (!child.trim()) { setMessage("Escribe el nombre del niño o niña antes de enviar."); return; }
    if (!blob) { setMessage("Primero graba un audio."); return; }
    if (!consent) { setMessage("Necesitamos tu consentimiento para tratar y almacenar el audio."); return; }
    setUploading(true); setProgress(0); setMessage("");
    const form = new FormData();
    form.append("audio", blob, "mensaje-familia.webm");
    form.append("childName", child.trim());
    form.append("senderName", sender.trim());
    form.append("durationSeconds", String(seconds));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/audios");
    xhr.upload.onprogress = e => { if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        setMessage("¡Audio enviado! Gracias por compartir tu voz. ❤️");
        setChild(""); setSender(""); setConsent(false); resetAudio();
      } else {
        try { setMessage(JSON.parse(xhr.responseText).error || "No se ha podido enviar. Inténtalo de nuevo."); }
        catch { setMessage("No se ha podido enviar. Inténtalo de nuevo."); }
      }
    };
    xhr.onerror = () => { setUploading(false); setMessage("Error de conexión. Comprueba internet e inténtalo de nuevo."); };
    xhr.send(form);
  }

  const time = `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return <main className="family-page">
    <header className="topbar"><div className="brand-mark"><Heart size={22} fill="currentColor" /></div><span>Voces que acompañan</span><Link href="/profesora" className="teacher-link">Aula</Link></header>
    <section className="hero">
      <div className="hero-icon"><span aria-hidden="true" style={{fontSize: 34}}>🐻</span></div>
      <p className="eyebrow">UN PEDACITO DE CASA, EN EL AULA</p>
      <h1>Un abrazo en forma<br/><em>de voz.</em></h1>
      <p className="intro">Déjale unas palabras bonitas para que pueda escucharte cuando esté en el cole. Tu voz le hará sentirse cerca de casa.</p>
    </section>

    <section className="card form-card">
      <label htmlFor="child">¿Para quién es el audio? <span className="required">*</span></label>
      <input id="child" value={child} onChange={e => setChild(e.target.value)} placeholder="Nombre del niño o niña" maxLength={100} required />
      <label htmlFor="sender">¿Quién envía el mensaje? <span className="optional">(opcional)</span></label>
      <input id="sender" value={sender} onChange={e => setSender(e.target.value)} placeholder="Tu nombre o parentesco" maxLength={100} />
      <div className="divider" />
      <div className="record-heading"><div><h2>Graba tu mensaje</h2><p>Busca un lugar tranquilo y habla cerquita del móvil.</p></div><span className="time-pill">{time} / 10:00</span></div>
      <div className={`record-box ${recording ? "is-recording" : ""}`}>
        <div className="sound-orb">{recording ? <span className="pulse-dot"/> : <Mic size={28}/>}</div>
        <strong>{recording ? "Te estamos escuchando…" : blob ? "¡Audio preparado!" : "Cuando quieras, empieza"}</strong>
        <span className="muted">{recording ? "Puedes detener la grabación cuando termines." : "Duración máxima: 10 minutos."}</span>
        <button className={`record-button ${recording ? "stop-button" : ""}`} onClick={recording ? stopRecording : startRecording} disabled={uploading}>
          {recording ? <><Square size={18} fill="currentColor"/> Detener grabación</> : <><Mic size={19}/> {blob ? "Grabar de nuevo" : "Grabar audio"}</>}
        </button>
      </div>
      {blob && !recording && <div className="preview">
        <div><strong>Escucha tu mensaje</strong><span>{time}</span></div>
        <audio ref={audioRef} src={previewUrl} controls onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
        <button className="text-button" onClick={resetAudio}>Eliminar y volver a grabar</button>
      </div>}
      <div className="consent">
        <input id="consent" type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
        <label htmlFor="consent">He leído y doy mi consentimiento para que la escuela almacene este audio y los datos asociados con la finalidad de reproducirlo en el aula. <span className="required">*</span></label>
      </div>
      <button className="send-button" onClick={sendAudio} disabled={uploading || recording || !blob}><Send size={18}/> {uploading ? "Enviando…" : "Enviar audio"}</button>
      {uploading && <div className="progress-wrap"><div className="progress-label"><span>Subiendo tu audio</span><strong>{progress}%</strong></div><div className="progress-track"><div className="progress-fill" style={{width: `${progress}%`}}/></div></div>}
      {message && <div className={`notice ${message.startsWith("¡Audio") ? "success" : "error"}`}>{message.startsWith("¡Audio") && <CheckCircle2 size={19}/>}<span>{message}</span></div>}
    </section>
    <footer>Con cariño, el equipo educativo · <span>Voces que acompañan</span></footer>
  </main>;
}
