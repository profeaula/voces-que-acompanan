import { NextResponse } from "next/server";
import { supabaseAdmin, BUCKET } from "@/lib/supabase-admin";

export async function DELETE(_req: Request, { params }: { params: Promise<{id:string}> }) {
  const { id } = await params;
  const { data: row, error } = await supabaseAdmin.from("audios").select("storage_path").eq("id", id).single();
  if (error || !row) return NextResponse.json({ error: "Audio no encontrado." }, { status: 404 });
  const { error: storageError } = await supabaseAdmin.storage.from(BUCKET).remove([row.storage_path]);
  if (storageError) return NextResponse.json({ error: "No se ha podido eliminar el archivo." }, { status: 500 });
  const { error: dbError } = await supabaseAdmin.from("audios").delete().eq("id", id);
  if (dbError) return NextResponse.json({ error: "No se han podido eliminar los datos." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
