-- Ejecutar en SQL Editor de Supabase.
create extension if not exists pgcrypto;

create table if not exists public.audios (
  id uuid primary key default gen_random_uuid(),
  child_name text not null check (char_length(child_name) between 1 and 100),
  sender_name text null check (sender_name is null or char_length(sender_name) <= 100),
  storage_path text not null unique,
  duration_seconds integer not null check (duration_seconds between 1 and 600),
  created_at timestamptz not null default now()
);

alter table public.audios enable row level security;
-- No se crean políticas públicas. Todas las operaciones se realizan desde
-- rutas de servidor con la clave service_role, que nunca se expone al navegador.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audios-familias', 'audios-familias', false, 26214400,
        array['audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/wav'])
on conflict (id) do update set public = false, file_size_limit = 26214400;
