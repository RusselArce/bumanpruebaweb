-- ============================================================
-- Migración: módulo "Deudores" en el sistema de permisos
-- Pega y ejecuta esto en el SQL Editor de Supabase
-- ============================================================

-- Registra el módulo para que pueda asignarse por rol/usuario en
-- permisos_default / permisos, igual que cualquier otro módulo de
-- Configuraciones. El superadmin ya ve el módulo sin esto (no tiene
-- restricciones); esto es solo para habilitarlo a otros roles.
insert into public.modulos (nombre, descripcion, icono, link, check, etiquetas)
select
  'Deudores',
  'Seguimiento a clientes con deuda (fiado) y registro de pagos',
  'DEU',
  '/configurar/deudores',
  true,
  null
where not exists (
  select 1 from public.modulos where link = '/configurar/deudores'
);
