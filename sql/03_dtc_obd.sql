-- Pega este script UNA vez en Supabase > SQL Editor > Run (después del 01 y 02)
create table if not exists public.dtc_obd(
 id uuid primary key default gen_random_uuid(),
 hash text unique not null,
 modulo text not null,
 dtc text not null,
 evento_falla text default '',
 tipo_falla text default '',
 comportamiento text default '',
 posibles_causas text default '',
 procedimiento_borrar text default '',
 accion_taller text default '',
 componente text default '',
 status text not null default 'pendiente' check (status in ('pendiente','validado')),
 updated_at timestamptz default now());
create index if not exists dtc_obd_dtc on dtc_obd(dtc);
create index if not exists dtc_obd_modulo on dtc_obd(modulo);
alter table dtc_obd enable row level security;
create policy o_sel on dtc_obd for select to authenticated using (status='validado' or is_admin());
create policy o_adm on dtc_obd for all using (is_admin()) with check (is_admin());
