# Volvo DTC Diagnostic
1. Supabase > Storage: crea buckets PRIVADOS "manuales" y "reparaciones".
2. Supabase > SQL Editor: pega sql/01_schema.sql y Run.
3. Supabase > Authentication > Users > Add user (Auto Confirm). Luego pega sql/02_admin.sql con tu correo y Run.
4. Vercel: importa el repo, y en Environment Variables importa/pega .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). Deploy.
