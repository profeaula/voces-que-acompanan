import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, BUCKET } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("audios").select("id,child_name,sender_name,created_at,duration_seconds").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Error al consultar los audios." }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("audio");
    const childName = String(form.get("childName") || "").trim();
    const senderName = String(form.get("senderName") || "").trim();
    const duration = Number(form.get("durationSeconds") || 0);
    if (!childName) return NextResponse.json({ error: "El nombre del niño o niña es obligatorio." }, { status: 400 });
    if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "No se ha recibido ningún audio." }, { status: 400 });
    if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "El archivo supera el máximo permitido de 25 MB." }, { status: 413 });
    if (!Number.isFinite(duration) || duration <= 0 || duration > 600) return NextResponse.json({ error: "El audio debe durar como máximo 10 minutos." }, { status: 400 });
    if (!file.type.startsWith("audio/")) return NextResponse.json({ error: "El archivo debe ser un audio." }, { status: 400 });

    const id = crypto.randomUUID();
    const path = `${id}.webm`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(path, bytes, { contentType: file.type || "audio/webm", upsert: false });
    if (uploadError) return NextResponse.json({ error: "No se ha podido guardar el archivo." }, { status: 500 });

    const { error: dbError } = await supabaseAdmin.from("audios").insert({
      id, child_name: childName.slice(0,100), sender_name: senderName ? senderName.slice(0,100) : null,
      storage_path: path, duration_seconds: Math.floor(duration)
    });
    if (dbError) {
      await supabaseAdmin.storage.from(BUCKET).remove([path]);
      return NextResponse.json({ error: "No se han podido guardar los datos del audio." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 400 });
  }
}
