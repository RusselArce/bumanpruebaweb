-- ============================================================
-- OBSOLETO: usuario_empresa ya se borró (confirmado — el Paso 0 dio
-- "relation public.usuario_empresa does not exist"). No corras nada de
-- este archivo, se deja solo como registro de lo que se hizo. Para el
-- fix del trigger de login usa fix_trigger_signup_duplicado.sql.
--
-- Riesgo a revisar: cualquier usuario dado de alta por la app entre el
-- 12-ago y ahora pudo haber quedado con id_empresa NULL para siempre
-- (su vínculo real vivía solo en usuario_empresa, y se borró sin haber
-- corrido antes el backfill). Corre esto para detectarlos:
--
--   select id, correo, nombres, id_auth, id_empresa, fecharegistro
--   from public.usuarios
--   where id_empresa is null
--   order by fecharegistro desc;
--
-- Si aparece alguien con id_auth NOT NULL (ya inició sesión alguna vez)
-- y id_empresa NULL, es un huérfano real: no hay forma automática de
-- recuperar a qué empresa pertenecía, hay que reasignarlo a mano.
-- ============================================================

-- Reversión: elimina usuario_empresa, vuelve al modelo plano
-- (usuarios.id_empresa / usuarios.id_rol como fuente de verdad).
-- Pega y ejecuta esto en el SQL Editor de Supabase, PASO POR PASO
-- (proyecto: posventas, PRODUCTION).
--
-- Modelo resultante:
--   - usuarios.id_auth  -> UNIQUE (una identidad de Google = una fila)
--   - usuarios.id_empresa -> FK normal, NO única (una empresa tiene
--     muchos usuarios: cajeros, meseros, etc. — eso está bien)
--   - usuarios.id_rol -> FK normal, el rol vigente de esa identidad
-- ============================================================

-- ------------------------------------------------------------
-- PASO 0 (solo lectura) — ¿hay identidades con más de una fila en
-- usuario_empresa (pertenecían a más de una empresa)? El backfill de
-- abajo solo puede dejarles UNA empresa en usuarios.id_empresa; revisa
-- estos casos antes de continuar para decidir cuál conservar.
-- ------------------------------------------------------------
select id_usuario, count(*) as empresas
from public.usuario_empresa
group by id_usuario
having count(*) > 1;

-- ------------------------------------------------------------
-- PASO 1 — backfill: usuarios que quedaron con id_empresa NULL porque
-- se dieron de alta después del 12-ago (cuando el alta escribía en
-- usuario_empresa en vez de en usuarios). Si una identidad tiene varias
-- filas en usuario_empresa, esto le asigna una cualquiera (ver Paso 0).
-- ------------------------------------------------------------
update public.usuarios u
set id_empresa = ue.id_empresa,
    id_rol = coalesce(u.id_rol, ue.id_rol)
from public.usuario_empresa ue
where ue.id_usuario = u.id
  and u.id_empresa is null;

-- ------------------------------------------------------------
-- PASO 2 — OJO: el `handle_new_user()` que estaba acá antes tocaba una
-- función que NO es la que corre en producción (se verificó en el
-- dashboard: el trigger real de auth.users llama a
-- `crear_empresa_personalizada()`, encadenada con `insertpordefecto()`
-- sobre `empresa`). El fix de ese trigger real está en
-- fix_trigger_signup_duplicado.sql — corre ese archivo para la parte
-- de login, este archivo ya no toca ningún trigger.
-- ------------------------------------------------------------
-- PASO 3 (solo lectura, opcional) — confirma que ya no queda nadie con
-- id_empresa NULL antes de borrar la tabla puente. Si esto devuelve
-- filas, revísalas a mano (probablemente invitaciones nunca reclamadas).
-- ------------------------------------------------------------
select id, correo, nombres, id_auth, id_empresa
from public.usuarios
where id_empresa is null;

-- ------------------------------------------------------------
-- PASO 4 — elimina la tabla puente. Irreversible: solo corre esto
-- después de confirmar el Paso 0 y el Paso 3.
-- ------------------------------------------------------------
drop table if exists public.usuario_empresa;
