-- PEGA TODO ESTE SCRIPT UNA SOLA VEZ en Supabase > SQL Editor > Run
-- (antes crea los buckets "manuales" y "reparaciones", privados, en Storage)
create extension if not exists pgcrypto;

create table public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 email text, full_name text default '', role text not null default 'tecnico' check (role in ('admin','tecnico')),
 active boolean not null default true, created_at timestamptz default now());

create or replace function public.is_admin() returns boolean language sql security definer stable set search_path=public as
$$ select exists(select 1 from profiles where id=auth.uid() and role='admin' and active) $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as
$$ begin insert into profiles(id,email) values(new.id,new.email) on conflict do nothing; return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.dtc_codes(
 id uuid primary key default gen_random_uuid(),
 code text not null, mid text default '', pid text default '', sid text default '', psid text default '', fmi text default '',
 description text default '', vehicle text not null default '', engine text not null default '', module text default '',
 system text default '', activation text default '', causes text default '', components_location text default '',
 tests text default '', measurements text default '', diagrams text default '', tools text default '',
 repair_procedure text default '', post_checks text default '', related_codes text default '',
 steps jsonb not null default '[]',
 source text default '', source_doc text default '', source_page text default '',
 status text not null default 'pendiente' check (status in ('pendiente','validado')),
 reviewed_by uuid references profiles(id), updated_at timestamptz default now(),
 unique(code,vehicle,engine));
create index on dtc_codes(code); create index on dtc_codes(status);

create table public.symptoms(id uuid primary key default gen_random_uuid(), name text unique not null);
create table public.dtc_symptoms(dtc_id uuid references dtc_codes on delete cascade, symptom_id uuid references symptoms on delete cascade, primary key(dtc_id,symptom_id));

create table public.repair_history(
 id uuid primary key default gen_random_uuid(), client_id text unique,
 dtc_code text not null, vehicle text default '', repair_date date default current_date,
 technician_id uuid references profiles(id) default auth.uid(),
 symptoms_found text default '', diagnosis text default '', cause text default '', repair text default '', parts text default '',
 notes text default '', result text default '',
 status text not null default 'pendiente_confirmar' check (status in ('pendiente_confirmar','solucion_verificada')),
 photo_path text, created_at timestamptz default now());
create index on repair_history(dtc_code);

alter table profiles enable row level security; alter table dtc_codes enable row level security;
alter table symptoms enable row level security; alter table dtc_symptoms enable row level security;
alter table repair_history enable row level security;

create policy p_sel on profiles for select using (id=auth.uid() or is_admin());
create policy p_adm on profiles for all using (is_admin()) with check (is_admin());
create policy d_sel on dtc_codes for select to authenticated using (status='validado' or is_admin());
create policy d_adm on dtc_codes for all using (is_admin()) with check (is_admin());
create policy s_sel on symptoms for select to authenticated using (true);
create policy s_adm on symptoms for all using (is_admin()) with check (is_admin());
create policy ds_sel on dtc_symptoms for select to authenticated using (true);
create policy ds_adm on dtc_symptoms for all using (is_admin()) with check (is_admin());
create policy r_sel on repair_history for select to authenticated using (true);
create policy r_ins on repair_history for insert to authenticated with check (technician_id=auth.uid());
create policy r_adm on repair_history for all using (is_admin()) with check (is_admin());

-- Crear usuarios desde la app (solo admin). Sin Edge Functions ni claves secretas.
create or replace function public.admin_create_user(p_email text,p_password text,p_name text,p_role text)
returns uuid language plpgsql security definer set search_path=public,extensions as $$
declare uid uuid:=gen_random_uuid();
begin
 if not is_admin() then raise exception 'No autorizado'; end if;
 if p_role not in ('admin','tecnico') then raise exception 'Rol inválido'; end if;
 if length(p_password)<8 then raise exception 'La contraseña debe tener 8+ caracteres'; end if;
 insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,email_change,email_change_token_new,recovery_token)
 values('00000000-0000-0000-0000-000000000000',uid,'authenticated','authenticated',lower(p_email),crypt(p_password,gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','');
 insert into auth.identities(id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
 values(gen_random_uuid(),uid,uid::text,jsonb_build_object('sub',uid::text,'email',lower(p_email)),'email',now(),now(),now());
 update profiles set role=p_role,full_name=p_name where id=uid;
 return uid;
end $$;
revoke all on function public.admin_create_user from public,anon;
grant execute on function public.admin_create_user to authenticated;

insert into symptoms(name) values ('Motor pierde potencia'),('Motor no arranca'),('Consumo elevado de combustible'),('Problemas de regeneración DPF'),('Problemas de AdBlue'),('Caja I-Shift no realiza cambios'),('Problemas de presión de aire'),('Fallas de frenos'),('Problemas eléctricos'),('Testigos encendidos en el tablero') on conflict do nothing;

create policy st_read on storage.objects for select to authenticated using (bucket_id in ('manuales','reparaciones'));
create policy st_adm on storage.objects for all using (bucket_id in ('manuales','reparaciones') and is_admin()) with check (bucket_id in ('manuales','reparaciones') and is_admin());
create policy st_rep on storage.objects for insert to authenticated with check (bucket_id='reparaciones');
