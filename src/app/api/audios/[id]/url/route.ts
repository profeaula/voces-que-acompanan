import { NextResponse } from "next/server";
import { supabaseAdmin, BUCKET } from "@/lib/supabase-admin";

export async function GET(_req: Request, { params }: { params: Promise<{id:string}> }) {
  const { id } = await params;
  const { data: row, error } = await supabaseAdmin.from("audios").select("storage_path").eq("id", id).single();
  if (error || !row) return NextResponse.json({ error: "Audio no encontrado." }, { status: 404 });
  const { data, error: signError } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(row.storage_path, 60 * 10);
  if (signError || !data) return NextResponse.json({ error: "No se puede reproducir el audio." }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
