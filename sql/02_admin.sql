-- Antes: crea tu usuario en Supabase > Authentication > Users > Add user (marca "Auto Confirm User").
-- Cambia el correo y ejecuta:
update public.profiles set role='admin', full_name='Administrador' where email='TU_CORREO@EJEMPLO.COM';
