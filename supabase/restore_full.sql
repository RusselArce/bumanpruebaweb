-- ============================================================================
--  BUMAM / buman-padre  ·  RESTAURACIÓN COMPLETA DE BASE DE DATOS
-- ----------------------------------------------------------------------------
--  Origen  : proyecto Supabase  qkzybkelsdmoezaaypou   (PostgreSQL 15.6)
--  Generado: 2026-08-31
--
--  QUÉ CONTIENE
--    1. Esquema public completo (tablas, secuencias, funciones, triggers,
--       policies RLS)  ── volcado con pg_dump --schema=public --schema-only
--    2. Override de la función insertarpermisohome():  al registrarse un
--       usuario NO superadmin se materializan en `permisos` todas las filas
--       de `permisos_dafault` de su rol (además del módulo Home '/').
--    3. Trigger sobre auth.users -> public.crear_empresa_personalizada()
--       (pg_dump no exporta objetos del esquema auth; se recrea aquí).
--    4. Semilla de catálogos globales: roles, modulos (+ módulo Deudores),
--       permisos_dafault, tipo_comprobantes  ── idempotente (ON CONFLICT).
--    5. GRANTs para anon / authenticated / service_role (PostgREST).
--
--  CÓMO RESTAURAR EN OTRA CUENTA DE SUPABASE
--    Opción A (psql):
--      psql "postgresql://postgres:<PASS>@db.<REF>.supabase.co:5432/postgres" \
--           -f supabase/restore_full.sql
--    Opción B (Dashboard): SQL Editor -> pegar este archivo -> Run.
--
--  REQUISITOS EN EL PROYECTO DESTINO (Supabase los trae por defecto):
--    · Extensiones en el esquema `extensions`: pgcrypto, uuid-ossp, pgjwt
--      (las usa crearcredencialesuser() / defaults gen_random_uuid()).
--    · Roles anon, authenticated, service_role (los crea Supabase).
--    · Esquema auth administrado por GoTrue (NO se toca aquí, solo el trigger).
--
--  NOTAS
--    · Pensado para un proyecto NUEVO/vacío: no lleva DROPs destructivos.
--      Releer el archivo sobre una base ya poblada puede chocar en los
--      CREATE TABLE/FUNCTION (no en la semilla, que es ON CONFLICT).
--    · La tabla se llama `permisos_dafault` (typo histórico en producción);
--      se respeta tal cual.
-- ============================================================================

BEGIN;
--
-- PostgreSQL database dump
--


-- Dumped from database version 15.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: asignarclientegenerico(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.asignarclientegenerico() RETURNS trigger
    LANGUAGE plpgsql
    AS $$declare _id_cliente int;
begin
 --seleccionamos el id del cliente generico
 select id into _id_cliente from clientes_proveedores where id_empresa = new.id_empresa and tipo='-';
-- editamos el cliente generico
 update ventas
 set id_cliente = _id_cliente  where id_cliente is null and id_empresa=new.id_empresa;
 return new;
end$$;


--
-- Name: buscarproductos(integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.buscarproductos(_id_empresa integer, buscador text) RETURNS TABLE(id integer, nombre text, precio_venta numeric, precio_compra numeric, id_categoria integer, sevende_por text, codigo_barras text, codigo_interno text, id_empresa integer, maneja_inventarios boolean, maneja_multiprecios boolean, p_venta text, p_compra text, categoria text)
    LANGUAGE sql
    AS $$
select p.id,
 p.nombre,p.precio_venta,p.precio_compra,p.id_categoria,p.sevende_por,p.codigo_barras,p.codigo_interno,p.id_empresa,p.maneja_inventarios,p.maneja_multiprecios,concat(e.simbolo_moneda,' ', p.precio_venta) as p_venta,concat(e.simbolo_moneda,' ', p.precio_compra) as p_compra,c.nombre as categoria
  from productos as p inner join empresa as e on e.id=p.id_empresa
  inner join categorias as c on c.id=p.id_categoria
  where (LOWER(p.nombre) LIKE '%' || LOWER(buscador) || '%' 
    OR LOWER(p.codigo_barras) LIKE '%' || LOWER(buscador) || '%'
    OR LOWER(p.codigo_interno) LIKE '%' || LOWER(buscador) || '%')
    AND p.id_empresa = _id_empresa
    ORDER BY p.nombre ASC
    LIMIT 10;
$$;


--
-- Name: buscarproductoslectora(integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.buscarproductoslectora(_id_empresa integer, buscador text) RETURNS TABLE(id integer, nombre text, precio_venta numeric, precio_compra numeric, id_categoria integer, sevende_por text, codigo_barras text, codigo_interno text, id_empresa integer, maneja_inventarios boolean, maneja_multiprecios boolean, p_venta text, p_compra text, categoria text)
    LANGUAGE sql
    AS $$
select p.id,
 p.nombre,p.precio_venta,p.precio_compra,p.id_categoria,p.sevende_por,p.codigo_barras,p.codigo_interno,p.id_empresa,p.maneja_inventarios,p.maneja_multiprecios,concat(e.simbolo_moneda,' ', p.precio_venta) as p_venta,concat(e.simbolo_moneda,' ', p.precio_compra) as p_compra,c.nombre as categoria
  from productos as p inner join empresa as e on e.id=p.id_empresa
  inner join categorias as c on c.id=p.id_categoria
  where  
    ( LOWER(p.codigo_barras) = LOWER(buscador)
    OR LOWER(p.codigo_interno) = LOWER(buscador))
    AND p.id_empresa = _id_empresa;
$$;


--
-- Name: buscarusuariosasignados(integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.buscarusuariosasignados(_id_empresa integer, buscador text) RETURNS TABLE(id_asignacion integer, id_usuario integer, usuario text, sucursal text, caja text, rol text, email text, estadouser text, id_rol integer, nro_doc text, telefono text)
    LANGUAGE sql
    AS $$
select asignacion_sucursal.id as id_asignacion,
 usuarios.id as id_usuario,
  usuarios.nombres as usuario,
sucursales.nombre as sucursal, 
caja.descripcion as caja,
 roles.nombre as rol , 
 usuarios.correo as email , 
 usuarios.estado as estadouser,
 roles.id as id_rol,
  nro_doc text, telefono text
 from asignacion_sucursal 
inner join sucursales on asignacion_sucursal.id_sucursal = sucursales.id
inner join usuarios on asignacion_sucursal.id_usuario = usuarios.id
inner join roles on usuarios.id_rol = roles.id
inner join caja on asignacion_sucursal.id_caja = caja.id
  where LOWER(usuarios.nombres) LIKE '%' || LOWER(buscador) || '%' and sucursales.id_empresa=_id_empresa and roles.nombre!='superadmin' ;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ventas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ventas (
    id bigint NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    monto_total numeric DEFAULT '0'::numeric,
    total_impuestos numeric DEFAULT '0'::numeric,
    id_usuario bigint,
    saldo numeric DEFAULT '0'::numeric,
    pago_con numeric DEFAULT '0'::numeric,
    referencia_tarjeta text DEFAULT '-'::text,
    vuelto numeric DEFAULT '0'::numeric,
    cantidad_productos bigint DEFAULT '0'::bigint,
    sub_total numeric DEFAULT '0'::numeric,
    id_cliente bigint,
    id_sucursal bigint,
    id_empresa bigint,
    estado text DEFAULT 'pendiente'::text,
    valor_impuesto numeric DEFAULT '0'::numeric,
    id_cierre_caja bigint,
    nro_comprobante text DEFAULT gen_random_uuid(),
    id_mesa bigint,
    nombre_ref text,
    propina numeric DEFAULT 0 NOT NULL
);


--
-- Name: confirmar_venta(integer, integer, numeric, integer, character varying, integer, integer, timestamp without time zone, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.confirmar_venta(_id_venta integer, _id_usuario integer, _vuelto numeric, _id_tipo_comprobante integer, _serie character varying, _id_sucursal integer, _id_cliente integer, _fecha timestamp without time zone, _monto_total numeric) RETURNS SETOF public.ventas
    LANGUAGE plpgsql
    AS $$
DECLARE
    nuevo_comprobante TEXT;
BEGIN
  -- Generar número de comprobante automáticamente con el ID del tipo de comprobante
  select generar_nro_comprobante(_id_tipo_comprobante, _serie, _id_sucursal)
  INTO nuevo_comprobante;
   -- Actualizar la venta existente con el número de comprobante, cliente y estado confirmado
  UPDATE ventas
  SET 
      estado = 'confirmada',
      nro_comprobante = nuevo_comprobante,
      id_usuario = _id_usuario,
      vuelto = _vuelto,
      id_cliente = _id_cliente,
      fecha = _fecha,
      monto_total = _monto_total
      WHERE id = _id_venta;
       RETURN QUERY SELECT * FROM ventas WHERE id = _id_venta;
END; 
$$;


--
-- Name: contarproductosporauth(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.contarproductosporauth(_id_auth text) RETURNS integer
    LANGUAGE sql
    AS $$
  select count(p.id)
  from productos p
  inner join empresa e on e.id = p.id_empresa
  where e.id_auth = _id_auth;
$$;


--
-- Name: crear_empresa_personalizada(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crear_empresa_personalizada() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_usuario_id bigint;
begin
  select id into v_usuario_id
  from public.usuarios
  where lower(trim(correo)) = lower(trim(new.email))
  limit 1;

  if v_usuario_id is not null then
    -- Ya lo invitó un admin a alguna empresa: solo inicia sesión,
    -- se vincula la identidad y punto. No se crea nada nuevo.
    update public.usuarios set id_auth = new.id where id = v_usuario_id;
    return new;
  end if;

  -- Nadie lo invitó: alta orgánica, es dueño nuevo de su propia
  -- empresa. insertpordefecto() se encarga del resto en cuanto esta
  -- fila de empresa exista.
  insert into public.empresa (id_auth, correo)
  values (new.id, new.email)
  on conflict (id_auth) do nothing;

  return new;
end;
$$;


--
-- Name: crear_empresa_por_default(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crear_empresa_por_default() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  user_email text := new.email;
  user_id text := new.id;
begin
  insert into public.empresa (
   
    id_auth,
    id_usuario,
    correo
  )
  values (
    user_id,
    null,
    user_email
  );

  return new;
end;
$$;


--
-- Name: crear_empresa_propia(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crear_empresa_propia(p_nombre text, p_direccion_fiscal text DEFAULT 'Sin dirección'::text) RETURNS bigint
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_correo text;
  v_usuario_viejo_id bigint;
  v_empresa_id bigint;
begin
  select id, correo into v_usuario_viejo_id, v_correo
  from usuarios
  where id_auth = auth.uid()::text
  limit 1;

  if v_correo is null then
    raise exception 'No se encontró un usuario para esta sesión';
  end if;

  -- suelta la fila de empleado (queda abandonada, sin id_auth)
  update usuarios set id_auth = null where id = v_usuario_viejo_id;

  -- dispara insertpordefecto(), que crea la fila nueva de usuarios con
  -- id_auth = auth.uid() (ya libre) + toda la empresa/kit (sucursal,
  -- caja, salón, mesas, categorías, métodos de pago, etc.)
  insert into empresa (id_auth, correo, nombre, direccion_fiscal)
  values (auth.uid()::text, v_correo, p_nombre, p_direccion_fiscal)
  returning id into v_empresa_id;

  return v_empresa_id;
end;
$$;


--
-- Name: crear_usuario_personalizado(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crear_usuario_personalizado() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.usuarios (
    nombres,
    id_tipodocumento,
    nro_doc,
    telefono,
    id_rol,
    correo,
    fecharegistro,
    estado,
    id_auth,
    tema
  )
  values (
    'Generico',
    1,
    '1',
    '-',
    1,
    new.email,
    current_date,
    'ACTIVO',
    new.id,
    'dark'
  )
  on conflict (id_auth) do nothing;

  return new;
end;
$$;


--
-- Name: crearcredencialesuser(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.crearcredencialesuser(email text, pass text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
   user_id uuid;
begin
   user_id := gen_random_uuid();
   insert into auth.users (
      id, 
      email, 
      encrypted_password, 
      raw_app_meta_data, 
      created_at, 
      updated_at, -- Incluye el campo updated_at
      instance_id, 
      aud, 
      role, 
      confirmation_token, 
      email_change, 
      email_change_token_new, 
      recovery_token, 
      phone_change, 
      email_confirmed_at
   )
   values (
      user_id,
      email,
      crypt(pass, gen_salt('bf')),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      now(),
      now(), -- Asigna la hora actual a updated_at
      (SELECT instance_id FROM auth.users WHERE instance_id IS NOT NULL LIMIT 1),
      'authenticated',
      'authenticated',
      '', -- confirmation_token
      '', -- email_change
      '', -- email_change_token_new
      '', -- recovery_token
      '', -- phone_change
      now()
   );
   return user_id;
end;
$$;


--
-- Name: dashboardcajasporsucursalyventas(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboardcajasporsucursalyventas(_id_empresa integer) RETURNS TABLE(sucursal_nombre text, caja_descripcion text, fecha_creacion timestamp without time zone, total_ventas numeric, estadocaja integer, direccionfiscal text, idcaja integer, idsucursal integer, delete boolean)
    LANGUAGE sql
    AS $$
WITH cierres_agrupados AS (
    SELECT
        cc.id_caja,
        MAX(cc.estado) AS estado,
        SUM(COALESCE(v.monto_total, 0)) AS total_ventas
    FROM
        cierrecaja cc
    LEFT JOIN
        ventas v
    ON
        cc.id = v.id_cierre_caja
    GROUP BY
        cc.id_caja
),
cajas_agrupadas AS (
    SELECT
        c.id AS id_caja,
        c.descripcion AS caja_descripcion,
        c.fecha_creacion,
        COALESCE(cg.total_ventas, 0) AS total_ventas,
        COALESCE(cg.estado, 2) AS estado
        
        
    FROM
        caja c
    LEFT JOIN
        cierres_agrupados cg
    ON
        c.id = cg.id_caja
)
SELECT
    s.nombre AS sucursal_nombre,
    ca.caja_descripcion,
    ca.fecha_creacion,
    ca.total_ventas,
    ca.estado AS estadocaja,
    s.direccion_fiscal as direccion_fiscal,
    ca.id_caja as idcaja,
    s.id as idsucursal,
    s.delete as delete


FROM
    sucursales s
INNER JOIN
    caja c
ON
    s.id = c.id_sucursal
LEFT JOIN
    cajas_agrupadas ca
ON
    c.id = ca.id_caja
WHERE
    s.id_empresa = _id_empresa
GROUP BY
    s.nombre, ca.caja_descripcion, ca.fecha_creacion, ca.total_ventas, ca.estado,ca.id_caja,s.id,s.direccion_fiscal,s.delete
ORDER BY
    s.nombre, ca.fecha_creacion;
$$;


--
-- Name: dashboardsumarcantidaddetalleventa(integer, timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboardsumarcantidaddetalleventa(_id_empresa integer, _fecha_inicio timestamp without time zone, _fecha_fin timestamp without time zone) RETURNS numeric
    LANGUAGE sql
    AS $$
SELECT 
    COALESCE(SUM(dv.cantidad), 0) -- Asegura que retorne 0 si no hay ventas
FROM 
    ventas AS v inner join detalle_venta dv on dv.id_venta=v.id
WHERE 
    v.id_empresa = _id_empresa
   AND DATE(v.fecha) >= DATE(_fecha_inicio) -- Convierte a solo fecha
  AND DATE(v.fecha) <= DATE(_fecha_fin);   -- Convierte a solo fecha
$$;


--
-- Name: dashboardsumargananciadetalleventa(integer, timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboardsumargananciadetalleventa(_id_empresa integer, _fecha_inicio timestamp without time zone, _fecha_fin timestamp without time zone) RETURNS numeric
    LANGUAGE sql
    AS $$
SELECT 
    COALESCE(SUM(dv.total - dv.cantidad*precio_compra), 0) -- Asegura que retorne 0 si no hay ventas
FROM 
    ventas AS v inner join detalle_venta dv on dv.id_venta=v.id
WHERE 
    v.id_empresa = _id_empresa
   AND DATE(v.fecha) >= DATE(_fecha_inicio) -- Convierte a solo fecha
  AND DATE(v.fecha) <= DATE(_fecha_fin);   -- Convierte a solo fecha
$$;


--
-- Name: dashboardsumarventaporempresa(integer, timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboardsumarventaporempresa(_id_empresa integer, _fecha_inicio timestamp without time zone, _fecha_fin timestamp without time zone) RETURNS numeric
    LANGUAGE sql
    AS $$
SELECT
    COALESCE(SUM(v.monto_total), 0) -- Asegura que siempre retorne 0 si no hay ventas
FROM
    ventas AS v
WHERE
    v.id_empresa = _id_empresa
    AND v.fecha >= _fecha_inicio
    AND v.fecha <= (_fecha_fin + INTERVAL '1 day' - INTERVAL '1 second'); -- Incluye el final del día
$$;


--
-- Name: dashboardsumarventasporempresa(integer, timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboardsumarventasporempresa(_id_empresa integer, _fecha_inicio timestamp without time zone, _fecha_fin timestamp without time zone) RETURNS numeric
    LANGUAGE sql
    AS $$
SELECT 
    COALESCE(SUM(v.monto_total), 0) -- Asegura que retorne 0 si no hay ventas
FROM 
    ventas AS v
WHERE 
    v.id_empresa = _id_empresa
   AND DATE(v.fecha) >= DATE(_fecha_inicio) -- Convierte a solo fecha
  AND DATE(v.fecha) <= DATE(_fecha_fin);   -- Convierte a solo fecha
$$;


--
-- Name: dashboardsumarventasporempresaperiodoanterior(integer, timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboardsumarventasporempresaperiodoanterior(_id_empresa integer, _fecha_inicio timestamp without time zone, _fecha_fin timestamp without time zone) RETURNS numeric
    LANGUAGE sql
    AS $$
SELECT 
    COALESCE(SUM(v.monto_total), 0) -- Asegura que retorne 0 si no hay ventas
FROM 
    ventas AS v
WHERE 
    v.id_empresa = _id_empresa
   AND DATE(v.fecha) >= DATE(_fecha_inicio) -- Convierte a solo fecha
  AND DATE(v.fecha) <= DATE(_fecha_fin);   -- Convierte a solo fecha
$$;


--
-- Name: dashboardtop5productosmasvendidos(integer, timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboardtop5productosmasvendidos(_id_empresa integer, _fecha_inicio timestamp without time zone, _fecha_fin timestamp without time zone) RETURNS TABLE(id_producto integer, nombre_producto text, total_vendido numeric, porcentaje numeric)
    LANGUAGE sql
    AS $$
WITH top_productos AS (
    SELECT
        dv.id_producto,
        p.nombre AS nombre_producto,
        SUM(dv.cantidad) AS total_vendido
    FROM
        detalle_venta AS dv
    INNER JOIN
        ventas AS v
    ON
        dv.id_venta = v.id
    INNER JOIN
        productos AS p
    ON
        dv.id_producto = p.id
    WHERE
        v.id_empresa = _id_empresa
       AND DATE(v.fecha) >= DATE(_fecha_inicio) -- Convierte a solo fecha
  AND DATE(v.fecha) <= DATE(_fecha_fin)   -- Convierte a solo fecha
    GROUP BY
        dv.id_producto, p.nombre
    ORDER BY
        total_vendido DESC
    LIMIT 5
),
total_general AS (
    SELECT
        SUM(total_vendido) AS total
    FROM
        top_productos
)
SELECT
    tp.id_producto,
    tp.nombre_producto,
    tp.total_vendido,
    ROUND((tp.total_vendido / tg.total) * 100, 2) AS porcentaje
FROM
    top_productos tp,
    total_general tg;
$$;


--
-- Name: dashboartotalventasconfechas(integer, timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboartotalventasconfechas(_id_empresa integer, _fecha_inicio timestamp without time zone, _fecha_fin timestamp without time zone) RETURNS TABLE(fecha date, total_ventas numeric)
    LANGUAGE sql
    AS $$
SELECT
    DATE(v.fecha) AS fecha, -- Agrupa por la fecha (sin tiempo)
    COALESCE(SUM(v.monto_total), 0) AS total_ventas -- Calcula el total de ventas
FROM
    ventas AS v
WHERE
    v.id_empresa = _id_empresa -- Filtra por empresa
    AND DATE(v.fecha) >= DATE(_fecha_inicio) -- Convierte a solo fecha
    AND DATE(v.fecha) <= DATE(_fecha_fin)   -- Convierte a solo fecha
GROUP BY
    DATE(v.fecha) -- Agrupa por fecha
ORDER BY
    fecha; -- Ordena por fecha
$$;


--
-- Name: dashboartotalventasxmetodopago(integer, timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dashboartotalventasxmetodopago(_id_empresa integer, _fecha_inicio timestamp without time zone, _fecha_fin timestamp without time zone) RETURNS TABLE(fecha date, metodo_pago text, total_ventas numeric)
    LANGUAGE sql
    AS $$
SELECT
    DATE(mc.fecha_movimiento) AS fecha, -- Agrupa por la fecha (sin tiempo)
    mp.nombre AS metodo_pago, -- Nombre del método de pago
    COALESCE(SUM(mc.monto), 0) AS total_ventas -- Suma el total de ventas
FROM
    ventas AS v
INNER JOIN
    movimientos_caja AS mc
ON
    v.id = mc.id_ventas -- Relación entre ventas y movimientos de caja
INNER JOIN
    metodos_pago AS mp
ON
    mc.id_metodo_pago = mp.id -- Relación con métodos de pago
WHERE
    v.id_empresa = _id_empresa -- Filtra por empresa
    AND DATE(mc.fecha_movimiento) >= DATE(_fecha_inicio) -- Filtra por fecha de inicio
    AND DATE(mc.fecha_movimiento) <= DATE(_fecha_fin) -- Filtra por fecha de fin
    AND mc.id_ventas IS NOT NULL
GROUP BY
    DATE(mc.fecha_movimiento), mp.nombre -- Agrupa por fecha y método de pago
ORDER BY
    fecha asc; -- Ordena por fecha y luego por total de ventas
$$;


--
-- Name: deletedetalleventa(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.deletedetalleventa() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Si la cantidad es igual a 0, elimina el registro antes del UPDATE
  IF NEW.cantidad = 0 THEN
    DELETE FROM detalle_venta WHERE id = NEW.id;
    
  END IF;

  RETURN NEW; -- Continuar el flujo si la cantidad no es 0
END;
$$;


--
-- Name: devolverstockaleliminardv(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.devolverstockaleliminardv() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Verificar si el producto tiene inventario gestionado
    IF (SELECT p.maneja_inventarios FROM productos p WHERE p.id = OLD.id_producto) THEN
        -- Incrementar el stock correspondiente en el almacén
        UPDATE stock
        SET stock = stock + OLD.cantidad
        WHERE id_producto = OLD.id_producto
          AND id_almacen = OLD.id_almacen;
    END IF;

    -- Continuar con la operación de eliminación
    RETURN OLD;
END;
$$;


--
-- Name: editarcantidaddv(integer, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.editarcantidaddv(_id integer, _cantidad numeric) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE detalle_venta
  SET 
    cantidad = _cantidad,
    total = _cantidad * precio_venta
  WHERE id = _id;
END;
$$;


--
-- Name: editarcategorias(text, integer, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.editarcategorias(_nombre text, _id_empresa integer, _color text, _id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
 perform 1 from categorias where id != _id and nombre = _nombre and id_empresa=_id_empresa;
 if found then
  raise exception 'Datos duplicados';
 else
  update categorias
  set
  nombre=_nombre,
  color=_color
  where id = _id;
 end if;  
end;
$$;


--
-- Name: editarclientesproveedores(integer, text, integer, text, text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.editarclientesproveedores(_id integer, _nombres text, _id_empresa integer, _direccion text, _telefono text, _email text, _identificador_nacional text, _identificador_fiscal text, _tipo text) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
 perform 1 from clientes_proveedores where (LOWER(nombres)=LOWER(_nombres) and tipo=_tipo and id!=_id and id_empresa=_id_empresa) or (LOWER(identificador_fiscal)=LOWER(_identificador_fiscal) and tipo=_tipo  and id!=_id and id_empresa=_id_empresa) or (LOWER(identificador_nacional)=LOWER(_identificador_nacional) and tipo=_tipo  and id!=_id and id_empresa=_id_empresa);
 if found then
  raise exception 'Datos duplicados';
 else
  update clientes_proveedores
  set
  nombres = _nombres,
        direccion = _direccion,
        telefono = _telefono,
        email = _email,
        identificador_nacional = _identificador_nacional,
        identificador_fiscal = _identificador_fiscal
       
  where id = _id;
 end if;  
end;
$$;


--
-- Name: editarmarca(text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.editarmarca(_nombre text, _id_empresa integer, _id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
 perform 1 from marca where nombre=_nombre and id_empresa=_id_empresa and id!=_id;
 if found then
   raise exception 'Datos duplicados';
 else
  update marca
  set nombre=_nombre
  where id=_id;
  end if;
end;
$$;


--
-- Name: editarproductos(integer, text, numeric, numeric, integer, text, text, integer, text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.editarproductos(_id integer, _nombre text, _precio_venta numeric, _precio_compra numeric, _id_categoria integer, _codigo_barras text, _codigo_interno text, _id_empresa integer, _sevende_por text, _maneja_inventarios boolean) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
 perform 1 from productos where nombre=_nombre and id_empresa=_id_empresa and id!=_id;
 if found then
   raise exception 'Nombre de producto duplicado';  
 else
    perform 1 from productos where (codigo_interno=_codigo_interno and id_empresa=_id_empresa and id!=_id) or 
    (codigo_barras=_codigo_barras
     and id_empresa=_id_empresa and id!=_id);
    if found then
     raise exception 'Codigo de barra ó interno duplicado';
    else
     update  productos set nombre=_nombre,precio_venta=_precio_venta,precio_compra=_precio_compra,id_categoria=_id_categoria,codigo_barras=_codigo_barras,codigo_interno=_codigo_interno,sevende_por=_sevende_por,maneja_inventarios=_maneja_inventarios
     where id=_id;
     end if;
  end if;
end;
$$;


--
-- Name: eliminar_detalle_y_liberar_mesa(bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.eliminar_detalle_y_liberar_mesa(p_detalle_id bigint) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
declare
  v_id_venta bigint;
  v_id_mesa  bigint;
  v_restantes int;
begin
  -- 1) obtener la venta del detalle
  select id_venta
    into v_id_venta
  from public.detalle_venta
  where id = p_detalle_id;

  -- 2) eliminar el detalle
  delete from public.detalle_venta
  where id = p_detalle_id;

  -- si no existía, listo
  if v_id_venta is null then
    return;
  end if;

  -- 3) contar detalles restantes en esa venta
  select count(*)
    into v_restantes
  from public.detalle_venta
  where id_venta = v_id_venta;

  -- si aún quedan items, no liberamos
  if v_restantes > 0 then
    return;
  end if;

  -- 4) obtener id_mesa desde ventas
  select id_mesa
    into v_id_mesa
  from public.ventas
  where id = v_id_venta;

  -- si no hay mesa (delivery), listo
  if v_id_mesa is null then
    return;
  end if;

  -- 5) liberar la mesa
  update public.mesas
  set estado = 'libre'
  where id = v_id_mesa;

end;
$$;


--
-- Name: generar_nro_comprobante(integer, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generar_nro_comprobante(_id_tipo_comprobante integer, _serie text, _id_sucursal integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    _nuevo_numero INTEGER;
    _nuevo_comprobante TEXT;
    _cantidad_numeros INTEGER;
BEGIN
    -- Obtener el correlativo actual y la cantidad de números usando _id_tipo_comprobante
    SELECT correlativo + 1, cantidad_numeros
    INTO _nuevo_numero, _cantidad_numeros
    FROM serializacion_comprobantes
    WHERE id_tipo_comprobante = _id_tipo_comprobante 
      AND serie = _serie 
      AND sucursal_id = _id_sucursal
    FOR UPDATE;

    -- Actualizar el correlativo en la tabla de serialización
    UPDATE serializacion_comprobantes
    SET correlativo = _nuevo_numero
    WHERE id_tipo_comprobante = _id_tipo_comprobante 
      AND serie = _serie 
      AND sucursal_id = _id_sucursal;

    -- Generar el número de comprobante con ceros a la izquierda
    _nuevo_comprobante := _serie || '-' || LPAD(_nuevo_numero::TEXT, _cantidad_numeros, '0');

    RETURN _nuevo_comprobante;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  v_user_id bigint;
  v_empresa_id bigint;
  v_rol_id bigint;
  v_sucursal_id bigint;
  v_salon_id bigint;
begin
  -- Obtener rol superadmin
  select id into v_rol_id from public.roles where lower(nombre) = 'superadmin' limit 1;

  -- Buscar usuario por correo
  select id into v_user_id from public.usuarios where correo = new.email limit 1;

  if v_user_id is not null then
    -- Si existe -> actualizar id_auth (misma identidad, ya tiene
    -- sus membresías propias en usuario_empresa)
    update public.usuarios set id_auth = new.id where id = v_user_id;
  else
    -- 1. Crear usuario
    insert into public.usuarios (id_auth, correo, nombres, estado, fecharegistro, id_rol)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', 'Usuario'), 'ACTIVO', now(), v_rol_id)
    returning id into v_user_id;

    -- 2. Crear empresa
    insert into public.empresa (nombre, id_usuario) values ('Mi empresa', v_user_id)
    returning id into v_empresa_id;

    -- 3. Membresía del usuario en su empresa nueva (reemplaza el
    -- "update usuarios set id_empresa = ..." de antes)
    insert into public.usuario_empresa (id_usuario, id_empresa, id_rol)
    values (v_user_id, v_empresa_id, v_rol_id);

    -- 4. Crear sucursal
    insert into public.sucursales (nombre, direccion_fiscal, id_empresa, delete)
    values ('Sucursal Principal', 'Sin dirección', v_empresa_id, false)
    returning id into v_sucursal_id;

    -- 5. Crear salón
    insert into public.salones (nombre, id_sucursal) values ('Salón Principal', v_sucursal_id)
    returning id into v_salon_id;

    -- 6. Crear mesas (ejemplo 5 mesas)
    insert into public.mesas (nombre, id_salon, posicion, estado)
    values ('Mesa 1', v_salon_id, jsonb_build_object('x',1,'y',1), 'libre');

    -- 7. Asignar usuario a sucursal
    insert into public.asignacion_sucursal (id_sucursal, id_usuario)
    values (v_sucursal_id, v_user_id);
  end if;

  return new;
end;
$$;


--
-- Name: incrementarstock(integer, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.incrementarstock(_id integer, cantidad numeric) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE stock SET stock = stock + cantidad WHERE id = _id;
END;
$$;


--
-- Name: insertar_productos(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insertar_productos() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    i INT;
    nuevo_codigo_interno TEXT;
    nuevo_codigo_barras TEXT;
BEGIN
    FOR i IN 1..5000 LOOP
        -- Generar códigos únicos usando el ID del ciclo (i) y un prefijo.
        nuevo_codigo_interno := 'INT-' || i || '-' || trunc(random() * 10000)::TEXT;
        nuevo_codigo_barras := 'BAR-' || i || '-' || trunc(random() * 100000)::TEXT;

        -- Insertar cada registro con datos aleatorios y los códigos generados.
        INSERT INTO productos (
            nombre,
            precio_venta,
            precio_compra,
            id_categoria,
            codigo_barras,
            codigo_interno,
            id_empresa,
            sevende_por,
            maneja_inventarios,
            maneja_multiprecios
        ) VALUES (
            'Producto ' || i,                       -- Nombre del producto.
            trunc(random() * 1000 + 1)::NUMERIC,    -- Precio de venta aleatorio.
            trunc(random() * 500 + 1)::NUMERIC,     -- Precio de compra aleatorio.
            2019,                                   -- ID de categoría.
            nuevo_codigo_barras,                    -- Código de barras único.
            nuevo_codigo_interno,                   -- Código interno único.
            6896,                                   -- ID de empresa.
            'unidad',                               -- Se vende por unidad.
            true,                                   -- Maneja inventario.
            false                                   -- No maneja múltiplos.
        );
    END LOOP;
END;
$$;


--
-- Name: insertarcategorias(text, text, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insertarcategorias(_nombre text, _color text, _icono text, _id_empresa integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
declare nuevo_id int;
begin
 perform 1 from categorias where nombre=_nombre and id_empresa=_id_empresa;
 if found then
   raise exception 'Datos duplicados';
 else
   insert into categorias(nombre,color,icono,id_empresa)
   values(_nombre,_color,_icono,_id_empresa)
   returning id into nuevo_id;
   return nuevo_id;
  end if;
end;
$$;


--
-- Name: insertarclientesproveedores(text, integer, text, text, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insertarclientesproveedores(_nombres text, _id_empresa integer, _direccion text, _telefono text, _email text, _identificador_nacional text, _identificador_fiscal text, _tipo text) RETURNS void
    LANGUAGE plpgsql
    AS $$

begin
 perform 1 from clientes_proveedores where (LOWER(nombres)=LOWER(_nombres) and tipo=_tipo) or (LOWER(identificador_fiscal)=LOWER(_identificador_fiscal) and tipo=_tipo) or (LOWER(identificador_nacional)=LOWER(_identificador_nacional) and tipo=_tipo);
 if found then
   raise exception 'Datos duplicados';
 else
   insert into clientes_proveedores(nombres,id_empresa,direccion,telefono,email,identificador_nacional,identificador_fiscal,tipo)
   values(_nombres,_id_empresa,_direccion,_telefono,_email,_identificador_nacional,_identificador_fiscal,_tipo);
  end if;
end;
$$;


--
-- Name: insertardetalleventa(integer, numeric, numeric, integer, numeric, text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insertardetalleventa(_id_venta integer, _cantidad numeric, _precio_venta numeric, _id_producto integer, _precio_compra numeric, _descripcion text, _id_sucursal integer, _id_almacen integer) RETURNS void
    LANGUAGE plpgsql
    AS $$BEGIN
  -- 1) Si ya existe el mismo producto PERO con estado = 'nueva', ahí sí acumulas
  IF EXISTS (
    SELECT 1
    FROM detalle_venta
    WHERE id_venta = _id_venta
      AND id_producto = _id_producto
      AND id_almacen = _id_almacen
      AND estado = 'nueva'
  ) THEN

    UPDATE detalle_venta
    SET cantidad = cantidad + _cantidad,
        total = (cantidad + _cantidad) * _precio_venta
    WHERE id_venta = _id_venta
      AND id_producto = _id_producto
      AND id_almacen = _id_almacen
      AND estado = 'nueva';

  ELSE
    -- 2) Si NO hay una fila "nueva" (aunque existan en_cocina), insertas SIEMPRE una nueva
    INSERT INTO detalle_venta (
      id_venta,
      id_producto,
      cantidad,
      precio_venta,
      precio_compra,
      descripcion,
      total,
      id_sucursal,
      id_almacen,
      estado
    ) VALUES (
      _id_venta,
      _id_producto,
      _cantidad,
      _precio_venta,
      _precio_compra,
      _descripcion,
      _cantidad * _precio_venta,
      _id_sucursal,
      _id_almacen,
      'nueva'
    );
  END IF;
END;$$;


--
-- Name: insertarimpresora(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insertarimpresora() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
 insert into impresoras (id_caja)
 values(new.id);
 return new;
end
$$;


--
-- Name: insertarmarca(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insertarmarca(_nombre text, _id_empresa integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
 perform 1 from marca where nombre=_nombre and id_empresa=_id_empresa;
 if found then
   raise exception 'Datos duplicados';
 else
   insert into marca(nombre,id_empresa)
   values(_nombre,_id_empresa);
  end if;
end;
$$;


--
-- Name: insertarpermisohome(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insertarpermisohome() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    id_modulo_home INT;
BEGIN
    -- Verifica si el rol no es 'superadmin' antes de proceder
    IF EXISTS (
        SELECT 1 
        FROM usuarios u 
        INNER JOIN roles r ON r.id = u.id_rol 
        WHERE r.nombre != 'superadmin' AND r.id = NEW.id_rol
    ) THEN
        -- Obtiene el ID del módulo correspondiente al '/'
        SELECT m.id 
        INTO id_modulo_home
        FROM modulos m 
        WHERE m.link = '/';
        
        -- Inserta el permiso en la tabla 'permisos'
        INSERT INTO permisos (id_usuario, idmodulo)
        VALUES (NEW.id, id_modulo_home);
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: insertarproductos(text, numeric, numeric, integer, text, text, integer, text, boolean, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insertarproductos(_nombre text, _precio_venta numeric, _precio_compra numeric, _id_categoria integer, _codigo_barras text, _codigo_interno text, _id_empresa integer, _sevende_por text, _maneja_inventarios boolean, _maneja_multiprecios boolean) RETURNS integer
    LANGUAGE plpgsql
    AS $$
declare nuevo_id int;
begin
 perform 1 from productos where nombre=_nombre and id_empresa=_id_empresa;
 if found then
   raise exception 'Nombre de producto duplicado';  
 else
    perform 1 from productos where codigo_interno=_codigo_interno or 
    codigo_barras=_codigo_barras
     and id_empresa=_id_empresa ;
    if found then
     raise exception 'Codigo de barra ó interno duplicado';
    else
     insert into productos(nombre,precio_venta,precio_compra,id_categoria,codigo_barras,codigo_interno,id_empresa,sevende_por,maneja_inventarios,maneja_multiprecios)
     values(_nombre,_precio_venta,_precio_compra,_id_categoria,_codigo_barras,_codigo_interno,_id_empresa,_sevende_por,_maneja_inventarios,_maneja_multiprecios)
     returning id into nuevo_id;
     return nuevo_id;
     end if;
  end if;
end;
$$;


--
-- Name: insertarserializaciones(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insertarserializaciones() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
 insert into serializacion_comprobantes (
  id_tipo_comprobante, serie, cantidad_numeros, correlativo, sucursal_id, por_default
)
values 
  (1, 'F001', 9, 0, NEW.id, false),
  (2, 'B001', 8, 0,  NEW.id, false),
  (3, 'NC01', 8, 0,  NEW.id, false),
  (4, 'ND01', 9, 0,  NEW.id, false),
  (5, 'T001', 8, 0,  NEW.id, true);
   return NEW;
end
$$;


--
-- Name: insertpordefecto(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.insertpordefecto() RETURNS trigger
    LANGUAGE plpgsql
    AS $$declare new_id_sucursal int;
declare new_id_tipo_documento int;
declare id_admin_rol INT;
declare new_id_usuario INT;
declare new_id_caja int;
declare new_id_categoria int;
declare new_id_salon int;
declare item record;
begin


 insert into tipodocumento(nombre,id_empresa)
 values('Generico',new.id)
 returning id into new_id_tipo_documento;
 --mostrar rol admin
 SELECT id INTO id_admin_rol
  FROM roles
  WHERE nombre = 'superadmin';
 --
--usuario admin
  insert into usuarios(nombres,id_tipodocumento,id_rol,correo,id_auth,id_empresa)
 values('Generico',new_id_tipo_documento,id_admin_rol,new.correo,new.id_auth,new.id)
 returning id into new_id_usuario;
--
--insertando los permisos al superadmin
for item in
  select id from modulos
  loop
 
    insert into permisos(id_usuario,idmodulo)
    values(new_id_usuario,item.id);  
  end loop;
--update a empresa con el id_usuario
 update empresa
 set id_usuario=new_id_usuario
 where id_usuario is null;
--
 insert into sucursales(nombre,direccion_fiscal,id_empresa,delete)
 values(new.nombre,new.direccion_fiscal,new.id,false)
 returning id into new_id_sucursal;

 insert into almacen(id_sucursal,delete,nombre)
 values(new_id_sucursal,false,'Almacen principal');

 insert into caja (descripcion,id_sucursal,delete)
 values('Caja principal',new_id_sucursal,false)
 returning id into new_id_caja;

 insert into salones (nombre,id_sucursal)
 values('Principal',new_id_sucursal)
 returning id into new_id_salon;

 insert into mesas (nombre,id_salon,posicion, estado)
 values ('01',new_id_salon,jsonb_build_object('x', 1, 'y', 1),
  'libre' );

   insert into mesas (nombre,id_salon,posicion, estado)
 values ('para_llevar',new_id_salon,jsonb_build_object('x', 1, 'y', 1),
  'libre' );


 insert into asignacion_sucursal(id_sucursal,id_usuario,id_caja)
 values(new_id_sucursal,new_id_usuario,new_id_caja);


 insert into categorias(nombre,color,icono,id_empresa)
 values('General','#FEC701','-',new.id)
  returning id into new_id_categoria;

 insert into productos(nombre,precio_venta,precio_compra,id_categoria, codigo_barras,codigo_interno,id_empresa)
 values ('Producto de prueba',10,5,new_id_categoria,'123456789','000123456',new.id);

 insert into clientes_proveedores(nombres,id_empresa)
 values ('Generico',new.id);

--agregar 4 metodos de pago por defecto
 insert into metodos_pago(nombre,id_empresa)
 values ('Efectivo',new.id);

  insert into metodos_pago(nombre,id_empresa)
 values ('Tarjeta',new.id);

 insert into metodos_pago(nombre,id_empresa)
 values ('Credito',new.id);

  insert into metodos_pago(nombre,id_empresa)
 values ('Mixto',new.id);

 --agregar pagos rapidos por defecto (cobro rapido en efectivo)
 insert into pagos_rapidos(id_empresa,monto,es_exacto,orden,state)
 values
   (new.id, 1, false, 1, true),
   (new.id, 5, false, 2, true),
   (new.id, 10, false, 3, true),
   (new.id, 20, false, 4, true),
   (new.id, 50, false, 5, true),
   (new.id, 100, false, 6, true),
   (new.id, 0, true, 7, true);


 return new;
end$$;


--
-- Name: mostrarcajasabiertasporempresa(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mostrarcajasabiertasporempresa(_id_empresa integer) RETURNS TABLE(id_cierre_caja integer, id_caja integer, usuario text, rol text)
    LANGUAGE sql
    AS $$
  select cierrecaja.id as id_cierre_caja, cierrecaja.id_caja,usuarios.nombres as usuario,roles.nombre as rol
  from cierrecaja
  inner join caja on caja.id = cierrecaja.id_caja
  inner join sucursales on sucursales.id = caja.id_sucursal
  inner join usuarios on usuarios.id=cierrecaja.id_usuario
  inner join roles on roles.id = usuarios.id_rol
  where cierrecaja.estado = 0
    and sucursales.id_empresa = _id_empresa
$$;


--
-- Name: mostrarcajasabiertasporsucursal(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mostrarcajasabiertasporsucursal(_id_sucursal integer) RETURNS TABLE(id_cierre_caja integer, id_caja integer, usuario text, rol text)
    LANGUAGE sql
    AS $$
  select cierrecaja.id as id_cierre_caja, cierrecaja.id_caja,usuarios.nombres as usuario,roles.nombre as rol
  from cierrecaja
  inner join caja on caja.id = cierrecaja.id_caja
  inner join sucursales on sucursales.id = caja.id_sucursal
  inner join usuarios on usuarios.id=cierrecaja.id_usuario
  inner join roles on roles.id = usuarios.id_rol
  where cierrecaja.estado = 0
    and caja.id_sucursal = _id_sucursal
$$;


--
-- Name: mostrarcajasasignadas(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mostrarcajasasignadas(_id_usuario integer) RETURNS TABLE(id integer, sucursal_caja text, id_caja text, id_sucursal integer)
    LANGUAGE sql
    AS $$
    SELECT
     ac.id,
      CONCAT(s.nombre, ' - ', c.descripcion) AS sucursal_caja,ac.id_caja,ac.id_sucursal
     
    FROM asignacion_sucursal ac inner join caja c on ac.id_caja=c.id
    inner join sucursales s on s.id=ac.id_sucursal 
    WHERE ac.id_usuario = _id_usuario;

$$;


--
-- Name: mostrarcierrecajaabierta(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mostrarcierrecajaabierta(_id_caja integer) RETURNS TABLE(id integer, id_sucursal integer, id_caja integer, id_usuario integer, fechainicio timestamp without time zone, fechacierre timestamp without time zone, caja text, sucursal text, estado_cierre_caja integer, usuario text, roluser text)
    LANGUAGE sql
    AS $$
    SELECT cc.id,c.id_sucursal,cc.id_caja,cc.id_usuario,cc.fechainicio,cc.fechacierre,c.descripcion as caja,s.nombre as sucursal,cc.estado as estado_cierre_caja,
    u.nombres,r.nombre as rol

    FROM cierrecaja cc inner join caja c on c.id=cc.id_caja
     inner join sucursales s on c.id_sucursal = s.id inner join usuarios as u on u.id=cc.id_usuario
     inner join roles r on r.id = u.id_rol
    where cc.estado = 0 and cc.id_caja = _id_caja;

$$;


--
-- Name: mostrardetalleventa(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mostrardetalleventa(_id_venta integer) RETURNS TABLE(producto text, precio_venta numeric, cantidad numeric, estado text, total numeric, id integer)
    LANGUAGE sql
    AS $$
select p.nombre as producto,dv.precio_venta,dv.cantidad,dv.estado,dv.total,dv.id from detalle_venta as dv
inner join productos as p on p.id=dv.id_producto
inner join sucursales as s on s.id=dv.id_sucursal

where dv.id_venta = _id_venta;
$$;


--
-- Name: empresa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresa (
    id bigint NOT NULL,
    nombre text DEFAULT 'Generica'::text NOT NULL,
    id_fiscal text DEFAULT '-'::text,
    direccion_fiscal text DEFAULT '-'::text,
    simbolo_moneda text DEFAULT '$'::text,
    logo text DEFAULT '-'::text,
    id_auth text DEFAULT ''::text NOT NULL,
    id_usuario bigint,
    iso text DEFAULT 'PE'::text,
    pais text DEFAULT 'Peru'::text,
    currency text DEFAULT 'PEN'::text,
    impuesto text DEFAULT 'IGV'::text,
    valor_impuesto numeric DEFAULT '18'::numeric,
    nombre_moneda text DEFAULT '-'::text,
    correo text DEFAULT ''::text,
    pie_pagina_ticket text DEFAULT '-'::text
);


--
-- Name: mostrarempresaxiduser(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mostrarempresaxiduser(_id_usuario integer) RETURNS TABLE(result public.empresa)
    LANGUAGE sql
    AS $$
with user_role as (
  select r.nombre as rol
  from usuarios u
  inner join roles r on u.id_rol = r.id
  where u.id = _id_usuario
)
select *
from (
  -- Caso 1: Si el usuario es 'superadmin'
  select *
  from empresa
  where empresa.id_usuario = _id_usuario
  
  union
  
  -- Caso 2: Si el usuario NO es 'superadmin'
  select empresa.*
  from asignacion_sucursal
  inner join usuarios on usuarios.id = asignacion_sucursal.id_usuario
  inner join sucursales on sucursales.id = asignacion_sucursal.id_sucursal
  inner join empresa on empresa.id = sucursales.id_empresa
  where asignacion_sucursal.id_usuario = _id_usuario
) result
where exists (
  select 1
  from user_role
  where (rol = 'superadmin') -- Solo valida el rol aquí
     or (rol <> 'superadmin') -- O cualquier otro rol
);
$$;


--
-- Name: mostrarmovimientoscajalive(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mostrarmovimientoscajalive(_id_empresa integer) RETURNS TABLE(usuario_nombre text, tipo_movimiento text, monto numeric, descripcion text, fecha_movimiento text, caja_nombre text, sucursal_nombre text, id integer)
    LANGUAGE sql
    AS $$
SELECT 
    u.nombres AS usuario_nombre,
    mc.tipo_movimiento,
    mc.monto,
    mc.descripcion,
    TO_CHAR(mc.fecha_movimiento,'DD-MM-YYYY HH24:MI:SS') as fecha_movimiento,
    c.descripcion AS caja_nombre,
    s.nombre AS sucursal_nombre,
    mc.id as id_mov_caja
FROM 
    movimientos_caja mc
INNER JOIN 
    cierrecaja cc ON mc.id_cierre_caja = cc.id
INNER JOIN 
    caja c ON cc.id_caja = c.id
INNER JOIN 
    sucursales s ON c.id_sucursal = s.id
INNER JOIN 
    usuarios u ON mc.id_usuario = u.id
WHERE 
    s.id_empresa = _id_empresa
ORDER BY 
    mc.fecha_movimiento DESC
LIMIT 10;
$$;


--
-- Name: mostrarproductos(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mostrarproductos(_id_empresa integer) RETURNS TABLE(id integer, nombre text, precio_venta numeric, precio_compra numeric, id_categoria integer, sevende_por text, codigo_barras text, codigo_interno text, id_empresa integer, maneja_inventarios boolean, maneja_multiprecios boolean, p_venta text, p_compra text, categoria text)
    LANGUAGE sql
    AS $$
select p.id,
 p.nombre,p.precio_venta,p.precio_compra,p.id_categoria,p.sevende_por,p.codigo_barras,p.codigo_interno,p.id_empresa,p.maneja_inventarios,p.maneja_multiprecios,concat(e.simbolo_moneda,' ', p.precio_venta) as p_venta,concat(e.simbolo_moneda,' ', p.precio_compra) as p_compra,c.nombre as categoria
  from productos as p inner join empresa as e on e.id=p.id_empresa
  inner join categorias as c on c.id=p.id_categoria
  where p.id_empresa=_id_empresa;
$$;


--
-- Name: mostrarsucursalesasignadas(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mostrarsucursalesasignadas(_id_usuario integer) RETURNS TABLE(id_sucursal integer, sucursal text, id_usuario integer, id_asignacion_sucursal integer)
    LANGUAGE sql
    AS $$
select s.id as id_sucursal,  s.nombre as sucursal,a.id_usuario,a.id as id_asignacion_sucursal  from 
asignacion_sucursal as a inner join sucursales
 as s on s.id=a.id_sucursal
 where a.id_usuario = _id_usuario;
$$;


--
-- Name: mostrartop10productosmasvendidosxmonto(integer, timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mostrartop10productosmasvendidosxmonto(_id_empresa integer, _fecha_inicio timestamp without time zone, _fecha_fin timestamp without time zone) RETURNS TABLE(id_producto integer, nombre_producto text, total_vendido numeric, porcentaje numeric)
    LANGUAGE sql
    AS $$
   with top_productos as (
      select dv.id_producto,
      p.nombre as nombre_producto,
      SUM(dv.total) as total_vendido
      from detalle_venta as dv
      inner join 
      ventas as v
      on
      dv.id_venta = v.id
      inner join 
      productos as p
      on 
      dv.id_producto = p.id
      where 
      v.id_empresa = _id_empresa
      and DATE(v.fecha) >= DATE(_fecha_inicio)
      and DATE(v.fecha) <= DATE(_fecha_fin)
      group by 
       dv.id_producto,p.nombre
      order by 
      total_vendido desc
      limit 10
   ),
 total_general as (
    select 
       SUM(total_vendido) as total
       from top_productos
 )
 select 
    tp.id_producto,
    tp.nombre_producto,
    tp.total_vendido,
    ROUND((tp.total_vendido/tg.total) * 100, 2) as porcentaje
 from
  top_productos tp,
  total_general tg;
$$;


--
-- Name: mostrartop5productosmasvendidosxcantidad(integer, timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mostrartop5productosmasvendidosxcantidad(_id_empresa integer, _fecha_inicio timestamp without time zone, _fecha_fin timestamp without time zone) RETURNS TABLE(id_producto integer, nombre_producto text, total_vendido numeric, porcentaje numeric)
    LANGUAGE sql
    AS $$
   with top_productos as (
      select dv.id_producto,
      p.nombre as nombre_producto,
      SUM(dv.cantidad) as total_vendido
      from detalle_venta as dv
      inner join 
      ventas as v
      on
      dv.id_venta = v.id
      inner join 
      productos as p
      on 
      dv.id_producto = p.id
      where 
      v.id_empresa = _id_empresa
      and DATE(v.fecha) >= DATE(_fecha_inicio)
      and DATE(v.fecha) <= DATE(_fecha_fin)
      group by 
       dv.id_producto,p.nombre
      order by 
      total_vendido desc
      limit 5
   ),
 total_general as (
    select 
       SUM(total_vendido) as total
       from top_productos
 )
 select 
    tp.id_producto,
    tp.nombre_producto,
    tp.total_vendido,
    ROUND((tp.total_vendido/tg.total) * 100, 2) as porcentaje
 from
  top_productos tp,
  total_general tg;
$$;


--
-- Name: mostrarusuariosasignados(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mostrarusuariosasignados(_id_empresa integer) RETURNS TABLE(id_asignacion integer, id_usuario integer, usuario text, sucursal text, caja text, rol text, email text, estadouser text, id_rol integer, nro_doc text, telefono text)
    LANGUAGE sql
    AS $$
select asignacion_sucursal.id as id_asignacion,
 usuarios.id as id_usuario,
  usuarios.nombres as usuario,
sucursales.nombre as sucursal, 
caja.descripcion as caja,
 roles.nombre as rol , 
 usuarios.correo as email , 
 usuarios.estado as estadouser,
 roles.id as id_rol,
 usuarios.nro_doc,
 usuarios.telefono
 from asignacion_sucursal 
inner join sucursales on asignacion_sucursal.id_sucursal = sucursales.id
inner join usuarios on asignacion_sucursal.id_usuario = usuarios.id
inner join roles on usuarios.id_rol = roles.id
inner join caja on asignacion_sucursal.id_caja = caja.id
  where sucursales.id_empresa=_id_empresa and roles.nombre!='superadmin';
$$;


--
-- Name: mostrarventasporsucursalfechas(integer, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.mostrarventasporsucursalfechas(_id_sucursal integer, _fecha_inicio date, _fecha_fin date) RETURNS SETOF public.ventas
    LANGUAGE sql
    AS $$
  select *
  from ventas
  where id_sucursal = _id_sucursal
    and estado = 'confirmada'
    and fecha::date between _fecha_inicio and _fecha_fin
$$;


--
-- Name: obtenertotalescaja(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.obtenertotalescaja(p_id_caja integer) RETURNS TABLE(total_ventas numeric, total_ingresos numeric, total_egresos numeric, total_ventas_efectivo numeric, total_ventas_credito numeric, total_ventas_tarjeta numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
 RETURN QUERY
    SELECT
        -- Subconsulta para evitar duplicación de ventas
        (SELECT COALESCE(SUM(v.monto_total), 0)
         FROM ventas v
         WHERE v.id_caja = p_id_caja  AND v.estado = 'confirmada'
           AND v.fecha BETWEEN cc.fechainicio AND NOW()) AS total_ventas,

        -- Subconsulta para sumar solo los ingresos
        (SELECT COALESCE(SUM(isc.monto), 0)
         FROM ingresos_salidas_caja isc
         WHERE isc.id_caja = p_id_caja 
           AND isc.tipo = 'ingreso'
           AND isc.fecha BETWEEN cc.fechainicio AND NOW()) AS total_ingresos,

        -- Subconsulta para sumar solo los egresos
        (SELECT COALESCE(SUM(isc.monto), 0)
         FROM ingresos_salidas_caja isc
         WHERE isc.id_caja = p_id_caja 
           AND isc.tipo = 'salida'
           AND isc.fecha BETWEEN cc.fechainicio AND NOW()) AS total_egresos,

        -- Total de ventas en efectivo
        (SELECT COALESCE(SUM(v.monto_total), 0)
         FROM ventas v
         WHERE v.id_caja = p_id_caja
           AND v.efectivo > 0
           AND v.estado = 'confirmada'
           AND v.fecha BETWEEN cc.fechainicio AND NOW()) AS total_ventas_efectivo,

        -- Total de ventas en crédito
        (SELECT COALESCE(SUM(v.monto_total), 0)
         FROM ventas v
         WHERE v.id_caja = p_id_caja
           AND v.credito > 0
           AND v.estado = 'confirmada'
           AND v.fecha BETWEEN cc.fechainicio AND NOW()) AS total_ventas_credito,

        -- Total de ventas en tarjeta
        (SELECT COALESCE(SUM(v.monto_total), 0)
         FROM ventas v
         WHERE v.id_caja = p_id_caja
           AND v.tarjeta > 0
           AND v.estado = 'confirmada'
           AND v.fecha BETWEEN cc.fechainicio AND NOW()) AS total_ventas_tarjeta   

    FROM cierrecaja cc
    WHERE cc.id_caja = p_id_caja;
END;
$$;


--
-- Name: reducirstock(integer, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reducirstock(_id integer, cantidad numeric) RETURNS void
    LANGUAGE plpgsql
    AS $$
 DECLARE stock_actual numeric;
BEGIN
        SELECT s.stock 
        INTO stock_actual
        FROM stock s 
        WHERE id = _id;
         IF stock_actual < cantidad then 
             RAISE EXCEPTION 'Stock insuficiente para este producto';
         else     
           UPDATE stock SET stock = stock - cantidad WHERE id = _id;
         end if;
END;
$$;


--
-- Name: report_stock_bajo_minimo(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.report_stock_bajo_minimo(sucursal_id integer, almacen_id integer) RETURNS TABLE(codigo_articulo text, descripcion_articulo text, stock numeric, stock_minimo numeric, precio_costo numeric, total numeric)
    LANGUAGE sql
    AS $$
SELECT 
    p.codigo_interno AS codigo_articulo,
    p.nombre AS descripcion_articulo,
    s.stock,
    s.stock_minimo,
    p.precio_compra AS precio_costo,
    (s.stock * p.precio_compra) AS total
FROM stock s
INNER JOIN almacen a ON s.id_almacen = a.id
INNER JOIN productos p ON s.id_producto = p.id
WHERE a.id_sucursal = sucursal_id
AND a.id = almacen_id
AND s.stock < s.stock_minimo;  -- 🔥 SOLO PRODUCTOS CON STOCK BAJO MÍNIMO
$$;


--
-- Name: report_stock_por_almacen_sucursal(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.report_stock_por_almacen_sucursal(sucursal_id integer, almacen_id integer) RETURNS TABLE(codigo_articulo text, descripcion_articulo text, stock numeric, precio_costo numeric, total numeric)
    LANGUAGE sql
    AS $$
SELECT 
    p.codigo_interno AS codigo_articulo,
    p.nombre AS descripcion_articulo,
    s.stock,
    p.precio_compra AS precio_costo,
    (s.stock * p.precio_compra) AS total
FROM stock s
INNER JOIN almacen a ON s.id_almacen = a.id
INNER JOIN productos p ON s.id_producto = p.id
WHERE a.id_sucursal = sucursal_id
AND a.id = almacen_id;
$$;


--
-- Name: report_ventas_por_sucursal(integer, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.report_ventas_por_sucursal(sucursal_id integer, fecha_inicio date, fecha_fin date) RETURNS TABLE(id_venta integer, fecha timestamp without time zone, monto_total numeric, total_impuestos numeric, subtotal numeric, saldo numeric, pago_con text, cantidad_productos integer, id_usuario integer, cajero text, id_cliente integer, estado text)
    LANGUAGE sql
    AS $$
SELECT 
    v.id AS id_venta,
    (v.fecha) AS fecha,  -- 🔥 Se convierte a solo fecha
    v.monto_total,
    v.total_impuestos,
    v.sub_total AS subtotal,
    v.saldo,
    v.pago_con,
    v.cantidad_productos,
    v.id_usuario,
    u.nombres AS cajero,
    v.id_cliente,
    v.estado
FROM ventas v
INNER JOIN usuarios u ON v.id_usuario = u.id
WHERE v.id_sucursal = sucursal_id
AND DATE(v.fecha) BETWEEN fecha_inicio AND fecha_fin; -- 🔥 Se filtra solo por día
$$;


--
-- Name: setdefaultserializacion(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.setdefaultserializacion(_id integer, _id_sucursal integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin 
  UPDATE serializacion_comprobantes
  SET por_default = false
   where sucursal_id=_id_sucursal;

    UPDATE serializacion_comprobantes
    SET por_default = true
     WHERE id = _id;
end;
$$;


--
-- Name: sumarefectivosinventasmovcierrecaja(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sumarefectivosinventasmovcierrecaja(_id_cierre_caja integer) RETURNS TABLE(tipo_movimiento text, monto numeric)
    LANGUAGE sql
    AS $$
SELECT 
   mc.tipo_movimiento,SUM(mc.monto) as monto
FROM 
  movimientos_caja AS mc
INNER JOIN 
  cierrecaja AS cc 
ON 
  mc.id_cierre_caja = cc.id
inner join metodos_pago as mp 
on
  mc.id_metodo_pago = mp.id  
WHERE 
  mp.nombre = 'Efectivo' and mc.id_ventas is null
  AND mc.id_cierre_caja = _id_cierre_caja and cc.estado=0
group by mc.tipo_movimiento
$$;


--
-- Name: sumarnoefectivosinventasmovcierrecaja(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sumarnoefectivosinventasmovcierrecaja(_id_cierre_caja integer) RETURNS TABLE(tipo_movimiento text, monto numeric, metodo text)
    LANGUAGE sql
    AS $$
SELECT 
   mc.tipo_movimiento,SUM(mc.monto) as monto, mp.nombre as metodo
FROM 
  movimientos_caja AS mc
INNER JOIN 
  cierrecaja AS cc 
ON 
  mc.id_cierre_caja = cc.id
inner join metodos_pago as mp 
on
  mc.id_metodo_pago = mp.id  
WHERE 
  mp.nombre != 'Efectivo' and mc.id_ventas is null
  AND mc.id_cierre_caja = _id_cierre_caja and cc.estado=0
group by mc.tipo_movimiento, mp.nombre
$$;


--
-- Name: sumarventasmetodopagomovcierrecaja(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sumarventasmetodopagomovcierrecaja(_id_cierre_caja integer) RETURNS TABLE(metodo_pago text, monto numeric)
    LANGUAGE sql
    AS $$
select mp.nombre as metodo_pago, SUM(CASE WHEN mp.nombre='Efectivo' THEN mc.monto - mc.vuelto ELSE mc.monto END ) as monto from
movimientos_caja as mc
inner join cierrecaja as cc 
on
mc.id_cierre_caja = cc.id
inner join metodos_pago as mp
on mc.id_metodo_pago = mp.id
where mc.id_ventas is not  null
and mc.id_cierre_caja = _id_cierre_caja and cc.estado = 0
group by mp.nombre

$$;


--
-- Name: sumarventasporempresa(integer, timestamp without time zone, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sumarventasporempresa(_id_empresa integer, _fecha_inicio timestamp without time zone, _fecha_fin timestamp without time zone) RETURNS numeric
    LANGUAGE sql
    AS $$
SELECT 
    COALESCE(SUM(v.monto_total), 0) -- Asegura que retorne 0 si no hay ventas
FROM 
    ventas AS v
WHERE 
    v.id_empresa = _id_empresa
    AND v.fecha >= _fecha_inicio
    AND v.fecha <= _fecha_fin;
$$;


--
-- Name: total_ventas_efectivo_por_cierre(bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.total_ventas_efectivo_por_cierre(p_id_cierre_caja bigint) RETURNS numeric
    LANGUAGE sql STABLE
    AS $$
select coalesce(sum(mc.monto),0)
from movimientos_caja mc
join metodos_pago mp
    on mp.id = mc.id_metodo_pago
where mc.id_cierre_caja = p_id_cierre_caja
and (mp.nombre) = 'Efectivo'
and mc.tipo_movimiento = 'venta';
$$;


--
-- Name: updateuseinventariosproductos(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.updateuseinventariosproductos() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
 update productos
 set maneja_inventarios=false
 where id=old.id_producto;
 return old;
end
$$;


--
-- Name: validarstock(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validarstock() RETURNS trigger
    LANGUAGE plpgsql
    AS $$DECLARE
    stock_actual numeric;
BEGIN
    -- Verificar si el producto maneja inventarios
    IF (SELECT p.maneja_inventarios FROM productos p WHERE p.id = NEW.id_producto) THEN
        -- Obtener el stock actual
        SELECT s.stock 
        INTO stock_actual
        FROM stock s 
        WHERE s.id_producto = NEW.id_producto 
          AND s.id_almacen = NEW.id_almacen;

        -- Incremento en cantidad
        IF TG_OP = 'UPDATE' AND NEW.cantidad > OLD.cantidad THEN
            -- Verificar si hay suficiente stock disponible para incrementar
            IF stock_actual < (NEW.cantidad - OLD.cantidad) THEN
                RAISE EXCEPTION 'Stock insuficiente para el producto %', NEW.descripcion;
            ELSE
                -- Descontar solo el incremento de cantidad
                UPDATE stock 
                SET stock = stock - (NEW.cantidad - OLD.cantidad)
                WHERE id_producto = NEW.id_producto 
                  AND id_almacen = NEW.id_almacen;
                insert into movimientos_stock (id_almacen,id_producto,tipo_movimiento,cantidad,fecha,detalle,origen)
                values(new.id_almacen,new.id_producto,'salida',new.cantidad,now(),'se edito el detalle de venta','ventas');
            END IF;
        END IF;

        -- Decremento en cantidad
        IF TG_OP = 'UPDATE' AND NEW.cantidad < OLD.cantidad THEN
            -- Aumentar el stock con la cantidad reducida
            UPDATE stock 
            SET stock = stock + (OLD.cantidad - NEW.cantidad)
            WHERE id_producto = NEW.id_producto 
              AND id_almacen = NEW.id_almacen;
            insert into movimientos_stock (id_almacen,id_producto,tipo_movimiento,cantidad,fecha,detalle,origen)
            values(new.id_almacen,new.id_producto,'ingreso',new.cantidad,now(),'se edito el detalle de venta','ventas');
        END IF;

        -- Inserción de nueva cantidad
        IF TG_OP = 'INSERT' THEN
            -- Verificar si hay suficiente stock para la cantidad solicitada
            IF stock_actual < NEW.cantidad THEN
                RAISE EXCEPTION 'Stock insuficiente para el producto %', NEW.descripcion;
            ELSE
                -- Descontar el stock directamente
                UPDATE stock 
                SET stock = stock - NEW.cantidad
                WHERE id_producto = NEW.id_producto 
                  AND id_almacen = NEW.id_almacen;
                insert into movimientos_stock (id_almacen,id_producto,tipo_movimiento,cantidad,fecha,detalle,origen)
                values(new.id_almacen,new.id_producto,'ingreso',new.cantidad,now(),'nuevo registro','ventas');
            END IF;
        END IF;

       
    END IF;

    RETURN NEW;
END;$$;


--
-- Name: ventas_por_metodo_por_cierre(bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ventas_por_metodo_por_cierre(p_id_cierre_caja bigint) RETURNS TABLE(nombre text, monto numeric)
    LANGUAGE sql STABLE
    AS $$
select 
    mp.nombre as nombre,
    sum(mc.monto) as monto
from movimientos_caja mc
join metodos_pago mp 
    on mp.id = mc.id_metodo_pago
where mc.id_cierre_caja = p_id_cierre_caja
and mc.tipo_movimiento = 'venta'
group by mp.nombre
order by mp.nombre;
$$;


--
-- Name: vincular_invitacion_con_auth_existente(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.vincular_invitacion_con_auth_existente() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  if new.id_auth is null then
    select id into new.id_auth
    from auth.users
    where lower(trim(email)) = lower(trim(new.correo))
    limit 1;
  end if;
  return new;
end;
$$;


--
-- Name: almacen; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.almacen (
    id bigint NOT NULL,
    id_sucursal bigint NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT now(),
    delete boolean DEFAULT true,
    nombre text,
    "default" boolean DEFAULT true
);


--
-- Name: almacen_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.almacen ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.almacen_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: asignacion_sucursal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asignacion_sucursal (
    id bigint NOT NULL,
    id_sucursal bigint NOT NULL,
    id_usuario bigint,
    id_caja bigint,
    id_auth uuid DEFAULT gen_random_uuid()
);


--
-- Name: asignacion_sucursal_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.asignacion_sucursal ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.asignacion_sucursal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: caja; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.caja (
    id bigint NOT NULL,
    descripcion text NOT NULL,
    id_sucursal bigint,
    fecha_creacion timestamp without time zone DEFAULT now(),
    delete boolean DEFAULT true,
    print boolean DEFAULT false
);


--
-- Name: caja_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.caja ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.caja_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: categorias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias (
    id bigint NOT NULL,
    nombre text NOT NULL,
    color text,
    icono text DEFAULT '-'::text,
    id_empresa bigint
);


--
-- Name: categorias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.categorias ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.categorias_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cierrecaja; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cierrecaja (
    fechainicio timestamp without time zone DEFAULT now(),
    fechacierre timestamp without time zone DEFAULT now(),
    id_usuario integer,
    total_efectivo_calculado numeric(18,2) DEFAULT '0'::numeric,
    total_efectivo_real numeric(18,2) DEFAULT '0'::numeric,
    estado bigint DEFAULT '0'::bigint,
    diferencia_efectivo numeric(18,2) DEFAULT '0'::numeric,
    id_caja integer,
    id bigint NOT NULL
);


--
-- Name: cierrecaja_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cierrecaja ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cierrecaja_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: clientes_proveedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes_proveedores (
    id bigint NOT NULL,
    nombres text DEFAULT '-'::text NOT NULL,
    id_empresa bigint,
    direccion text DEFAULT '-'::text,
    telefono text DEFAULT '-'::text,
    email text DEFAULT '-'::text,
    identificador_nacional text DEFAULT '-'::text,
    identificador_fiscal text DEFAULT '-'::text,
    tipo text DEFAULT '-'::text,
    estado text DEFAULT 'activo'::text,
    fecha_registro timestamp without time zone DEFAULT now()
);


--
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.clientes_proveedores ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.clientes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: detalle_venta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detalle_venta (
    id bigint NOT NULL,
    id_venta bigint NOT NULL,
    cantidad numeric DEFAULT '1'::numeric,
    precio_venta numeric,
    total numeric,
    descripcion text,
    id_producto bigint,
    precio_compra numeric,
    id_sucursal bigint,
    estado text DEFAULT 'nueva'::text,
    id_almacen bigint,
    nota text DEFAULT '-'::text,
    prioridad bigint DEFAULT '0'::bigint,
    modificadores jsonb
);


--
-- Name: detalle_venta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.detalle_venta ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.detalle_venta_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: empresa_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.empresa ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.empresa_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: impresoras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.impresoras (
    id bigint NOT NULL,
    id_caja bigint NOT NULL,
    pc_name text DEFAULT '-'::text,
    ip_local text DEFAULT '-'::text,
    state boolean DEFAULT false,
    name text DEFAULT '-'::text
);


--
-- Name: impresoras_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.impresoras ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.impresoras_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: kardex; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kardex (
    id bigint NOT NULL,
    fecha date NOT NULL,
    motivo text,
    cantidad numeric,
    id_producto bigint,
    id_usuario bigint,
    tipo text,
    estado text,
    total numeric,
    costo numeric,
    habia numeric,
    hay numeric
);


--
-- Name: kardex_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.kardex ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.kardex_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: mesas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mesas (
    id bigint NOT NULL,
    nombre text NOT NULL,
    id_salon bigint,
    posicion jsonb,
    estado text DEFAULT 'libre'::text NOT NULL,
    CONSTRAINT mesas_estado_check CHECK ((estado = ANY (ARRAY['libre'::text, 'ocupada'::text, 'reservada'::text, 'eliminada'::text])))
);


--
-- Name: mesas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.mesas ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.mesas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: metodos_pago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metodos_pago (
    id bigint NOT NULL,
    nombre text NOT NULL,
    id_empresa bigint,
    icono text DEFAULT '-'::text,
    ver_nombre boolean DEFAULT true,
    delete_update boolean DEFAULT false,
    "default" boolean DEFAULT true,
    state boolean DEFAULT true
);


--
-- Name: metodos_pago_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.metodos_pago ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.metodos_pago_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: modificadores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modificadores (
    id bigint NOT NULL,
    id_empresa bigint,
    nombre text NOT NULL,
    precio_extra numeric DEFAULT 0 NOT NULL,
    state boolean DEFAULT true NOT NULL
);


--
-- Name: modificadores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.modificadores ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.modificadores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: modulos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modulos (
    id bigint NOT NULL,
    nombre text DEFAULT '-'::text NOT NULL,
    "check" boolean DEFAULT false,
    descripcion text DEFAULT '-'::text,
    icono text DEFAULT '-'::text,
    link text DEFAULT '-'::text,
    etiquetas text DEFAULT '#configuracion'::text
);


--
-- Name: modulos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.modulos ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.modulos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: movimientos_caja; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimientos_caja (
    id bigint NOT NULL,
    fecha_movimiento timestamp without time zone DEFAULT now() NOT NULL,
    tipo_movimiento text,
    monto numeric DEFAULT '0'::numeric,
    id_metodo_pago bigint,
    descripcion text DEFAULT '-'::text,
    id_usuario bigint,
    id_cierre_caja bigint,
    id_ventas bigint,
    vuelto numeric DEFAULT '0'::numeric
);


--
-- Name: movimientos_caja_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.movimientos_caja ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.movimientos_caja_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: movimientos_stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimientos_stock (
    id bigint NOT NULL,
    id_almacen bigint NOT NULL,
    id_producto bigint,
    tipo_movimiento text,
    cantidad numeric,
    fecha timestamp with time zone DEFAULT now(),
    detalle text DEFAULT '-'::text,
    origen text DEFAULT '-'::text
);


--
-- Name: movimientos_stock_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.movimientos_stock ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.movimientos_stock_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: multiprecios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.multiprecios (
    id bigint NOT NULL,
    precio_venta numeric NOT NULL,
    id_producto bigint,
    cantidad numeric
);


--
-- Name: multiprecios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.multiprecios ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.multiprecios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: pagos_rapidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagos_rapidos (
    id bigint NOT NULL,
    id_empresa bigint,
    monto numeric DEFAULT 0 NOT NULL,
    es_exacto boolean DEFAULT false NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    state boolean DEFAULT true NOT NULL
);


--
-- Name: pagos_rapidos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.pagos_rapidos ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.pagos_rapidos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: permisos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permisos (
    id bigint NOT NULL,
    id_usuario bigint NOT NULL,
    idmodulo bigint
);


--
-- Name: permisos_dafault; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permisos_dafault (
    id bigint NOT NULL,
    id_rol bigint NOT NULL,
    id_modulo bigint
);


--
-- Name: permisos_dafault_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.permisos_dafault ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.permisos_dafault_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: permisos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.permisos ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.permisos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: producto_modificadores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.producto_modificadores (
    id bigint NOT NULL,
    id_producto bigint NOT NULL,
    id_modificador bigint NOT NULL
);


--
-- Name: producto_modificadores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.producto_modificadores ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.producto_modificadores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: productos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.productos (
    id bigint NOT NULL,
    nombre text NOT NULL,
    precio_venta numeric DEFAULT '0'::numeric,
    precio_compra numeric DEFAULT '0'::numeric,
    id_categoria bigint,
    codigo_barras text,
    codigo_interno text,
    id_empresa bigint,
    sevende_por text DEFAULT 'unidad'::text,
    maneja_inventarios boolean DEFAULT false,
    maneja_multiprecios boolean DEFAULT false
);


--
-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.productos ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.productos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rifas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rifas (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    precio_boleto numeric(10,2) DEFAULT 0 NOT NULL,
    total_numeros integer DEFAULT 100 NOT NULL,
    numeros_vendidos integer[] DEFAULT '{}'::integer[],
    estado character varying(50) DEFAULT 'activa'::character varying NOT NULL,
    ganador_numero integer,
    ganador_nombre character varying(255),
    fecha_sorteo timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT rifas_estado_check CHECK (((estado)::text = ANY ((ARRAY['activa'::character varying, 'cerrada'::character varying, 'sorteada'::character varying])::text[])))
);


--
-- Name: rifas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rifas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rifas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rifas_id_seq OWNED BY public.rifas.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id bigint NOT NULL,
    nombre text NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.roles ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: salones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salones (
    id bigint NOT NULL,
    nombre text NOT NULL,
    id_sucursal bigint
);


--
-- Name: salones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.salones ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.salones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: serializacion_comprobantes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.serializacion_comprobantes (
    id bigint NOT NULL,
    id_tipo_comprobante bigint NOT NULL,
    serie text,
    cantidad_numeros bigint,
    correlativo bigint,
    sucursal_id bigint,
    por_default boolean DEFAULT false
);


--
-- Name: serializacion_comprobantes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.serializacion_comprobantes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.serializacion_comprobantes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock (
    id bigint NOT NULL,
    id_almacen bigint NOT NULL,
    id_producto bigint,
    stock numeric DEFAULT '0'::numeric,
    stock_minimo numeric DEFAULT '0'::numeric,
    ubicacion text DEFAULT '-'::text
);


--
-- Name: stock_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.stock ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.stock_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sucursales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sucursales (
    id bigint NOT NULL,
    nombre text,
    direccion_fiscal text,
    id_empresa bigint,
    delete boolean DEFAULT true
);


--
-- Name: sucursales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sucursales ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sucursales_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tipo_comprobantes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_comprobantes (
    id bigint NOT NULL,
    nombre text NOT NULL,
    destino text
);


--
-- Name: tipo_comprobantes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.tipo_comprobantes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.tipo_comprobantes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tipodocumento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipodocumento (
    id bigint NOT NULL,
    nombre text DEFAULT ''::text NOT NULL,
    id_empresa bigint
);


--
-- Name: tipodocumento_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.tipodocumento ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.tipodocumento_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id bigint NOT NULL,
    nombres text DEFAULT '-'::text NOT NULL,
    id_tipodocumento bigint DEFAULT '1'::bigint,
    nro_doc text DEFAULT '-'::text,
    telefono text DEFAULT '-'::text,
    id_rol bigint,
    correo text DEFAULT '-'::text,
    fecharegistro date DEFAULT now(),
    estado text DEFAULT 'ACTIVO'::text,
    id_auth text,
    tema text DEFAULT 'light'::text,
    id_empresa bigint
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.usuarios ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ventas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.ventas ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.ventas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rifas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rifas ALTER COLUMN id SET DEFAULT nextval('public.rifas_id_seq'::regclass);


--
-- Name: almacen almacen_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.almacen
    ADD CONSTRAINT almacen_pkey PRIMARY KEY (id);


--
-- Name: asignacion_sucursal asignacion_sucursal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignacion_sucursal
    ADD CONSTRAINT asignacion_sucursal_pkey PRIMARY KEY (id);


--
-- Name: caja caja_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caja
    ADD CONSTRAINT caja_pkey PRIMARY KEY (id);


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- Name: cierrecaja cierrecaja_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cierrecaja
    ADD CONSTRAINT cierrecaja_pkey PRIMARY KEY (id);


--
-- Name: clientes_proveedores clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes_proveedores
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: detalle_venta detalle_venta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_venta
    ADD CONSTRAINT detalle_venta_pkey PRIMARY KEY (id);


--
-- Name: empresa empresa_id_auth_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa
    ADD CONSTRAINT empresa_id_auth_key UNIQUE (id_auth);


--
-- Name: empresa empresa_id_auth_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa
    ADD CONSTRAINT empresa_id_auth_unique UNIQUE (id_auth);


--
-- Name: empresa empresa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa
    ADD CONSTRAINT empresa_pkey PRIMARY KEY (id);


--
-- Name: impresoras impresoras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.impresoras
    ADD CONSTRAINT impresoras_pkey PRIMARY KEY (id);


--
-- Name: kardex kardex_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kardex
    ADD CONSTRAINT kardex_pkey PRIMARY KEY (id);


--
-- Name: mesas mesas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mesas
    ADD CONSTRAINT mesas_pkey PRIMARY KEY (id);


--
-- Name: metodos_pago metodos_pago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metodos_pago
    ADD CONSTRAINT metodos_pago_pkey PRIMARY KEY (id);


--
-- Name: modificadores modificadores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modificadores
    ADD CONSTRAINT modificadores_pkey PRIMARY KEY (id);


--
-- Name: modulos modulos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modulos
    ADD CONSTRAINT modulos_pkey PRIMARY KEY (id);


--
-- Name: movimientos_caja movimientos_caja_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_pkey PRIMARY KEY (id);


--
-- Name: movimientos_stock movimientos_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_stock
    ADD CONSTRAINT movimientos_stock_pkey PRIMARY KEY (id);


--
-- Name: multiprecios multiprecios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.multiprecios
    ADD CONSTRAINT multiprecios_pkey PRIMARY KEY (id);


--
-- Name: pagos_rapidos pagos_rapidos_id_empresa_monto_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos_rapidos
    ADD CONSTRAINT pagos_rapidos_id_empresa_monto_key UNIQUE (id_empresa, monto);


--
-- Name: pagos_rapidos pagos_rapidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos_rapidos
    ADD CONSTRAINT pagos_rapidos_pkey PRIMARY KEY (id);


--
-- Name: permisos_dafault permisos_dafault_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos_dafault
    ADD CONSTRAINT permisos_dafault_pkey PRIMARY KEY (id);


--
-- Name: permisos permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_pkey PRIMARY KEY (id);


--
-- Name: producto_modificadores producto_modificadores_id_producto_id_modificador_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto_modificadores
    ADD CONSTRAINT producto_modificadores_id_producto_id_modificador_key UNIQUE (id_producto, id_modificador);


--
-- Name: producto_modificadores producto_modificadores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto_modificadores
    ADD CONSTRAINT producto_modificadores_pkey PRIMARY KEY (id);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- Name: rifas rifas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rifas
    ADD CONSTRAINT rifas_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: salones salones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salones
    ADD CONSTRAINT salones_pkey PRIMARY KEY (id);


--
-- Name: serializacion_comprobantes serializacion_comprobantes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.serializacion_comprobantes
    ADD CONSTRAINT serializacion_comprobantes_pkey PRIMARY KEY (id);


--
-- Name: stock stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT stock_pkey PRIMARY KEY (id);


--
-- Name: sucursales sucursales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sucursales
    ADD CONSTRAINT sucursales_pkey PRIMARY KEY (id);


--
-- Name: tipo_comprobantes tipo_comprobantes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_comprobantes
    ADD CONSTRAINT tipo_comprobantes_pkey PRIMARY KEY (id);


--
-- Name: tipodocumento tipodocumento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipodocumento
    ADD CONSTRAINT tipodocumento_pkey PRIMARY KEY (id);


--
-- Name: almacen unique_almacen_por_sucursal; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.almacen
    ADD CONSTRAINT unique_almacen_por_sucursal UNIQUE (id_sucursal, nombre);


--
-- Name: caja unique_caja_por_sucursal; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caja
    ADD CONSTRAINT unique_caja_por_sucursal UNIQUE (descripcion, id_sucursal);


--
-- Name: metodos_pago unique_nombre_id_empresa; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metodos_pago
    ADD CONSTRAINT unique_nombre_id_empresa UNIQUE (nombre, id_empresa);


--
-- Name: sucursales unique_nombre_por_empresa; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sucursales
    ADD CONSTRAINT unique_nombre_por_empresa UNIQUE (nombre, id_empresa);


--
-- Name: ventas unique_nrocomprobante_id_sucursal; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT unique_nrocomprobante_id_sucursal UNIQUE (nro_comprobante, id_sucursal);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: ventas ventas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_pkey PRIMARY KEY (id);


--
-- Name: categorias_nombre_por_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX categorias_nombre_por_empresa ON public.categorias USING btree (nombre, id_empresa);


--
-- Name: mesas_nombre_por_salon; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX mesas_nombre_por_salon ON public.mesas USING btree (nombre, id_salon);


--
-- Name: ventas asignarclientegenericotrigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER asignarclientegenericotrigger AFTER INSERT ON public.ventas FOR EACH ROW EXECUTE FUNCTION public.asignarclientegenerico();


--
-- Name: ventas asignarclientegenericotriggerupdate; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER asignarclientegenericotriggerupdate AFTER UPDATE ON public.ventas FOR EACH ROW EXECUTE FUNCTION public.asignarclientegenerico();


--
-- Name: caja insertarimpresoratrigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER insertarimpresoratrigger AFTER INSERT ON public.caja FOR EACH ROW EXECUTE FUNCTION public.insertarimpresora();


--
-- Name: sucursales insertarserializacionestrigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER insertarserializacionestrigger AFTER INSERT ON public.sucursales FOR EACH ROW EXECUTE FUNCTION public.insertarserializaciones();


--
-- Name: empresa pordefectotrigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER pordefectotrigger AFTER INSERT ON public.empresa FOR EACH ROW EXECUTE FUNCTION public.insertpordefecto();


--
-- Name: detalle_venta triggerdevolverstockaleliminardv; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER triggerdevolverstockaleliminardv AFTER DELETE ON public.detalle_venta FOR EACH ROW EXECUTE FUNCTION public.devolverstockaleliminardv();


--
-- Name: detalle_venta triggereliminardetalleventa; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER triggereliminardetalleventa AFTER UPDATE ON public.detalle_venta FOR EACH ROW EXECUTE FUNCTION public.deletedetalleventa();


--
-- Name: usuarios triggerinsertarpermisohome; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER triggerinsertarpermisohome AFTER INSERT ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.insertarpermisohome();


--
-- Name: detalle_venta triggervalidarstock; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER triggervalidarstock BEFORE INSERT OR UPDATE ON public.detalle_venta FOR EACH ROW EXECUTE FUNCTION public.validarstock();


--
-- Name: usuarios vincular_invitacion_con_auth_existente; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER vincular_invitacion_con_auth_existente BEFORE INSERT ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.vincular_invitacion_con_auth_existente();


--
-- Name: almacen almacen_id_sucursal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.almacen
    ADD CONSTRAINT almacen_id_sucursal_fkey FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id) ON DELETE CASCADE;


--
-- Name: asignacion_sucursal asignacion_sucursal_id_caja_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignacion_sucursal
    ADD CONSTRAINT asignacion_sucursal_id_caja_fkey FOREIGN KEY (id_caja) REFERENCES public.caja(id) ON DELETE CASCADE;


--
-- Name: asignacion_sucursal asignacion_sucursal_id_sucursal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignacion_sucursal
    ADD CONSTRAINT asignacion_sucursal_id_sucursal_fkey FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id) ON DELETE CASCADE;


--
-- Name: asignacion_sucursal asignacion_sucursal_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignacion_sucursal
    ADD CONSTRAINT asignacion_sucursal_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: caja caja_id_sucursal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.caja
    ADD CONSTRAINT caja_id_sucursal_fkey FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cierrecaja cierrecaja_id_caja_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cierrecaja
    ADD CONSTRAINT cierrecaja_id_caja_fkey FOREIGN KEY (id_caja) REFERENCES public.caja(id) ON DELETE CASCADE;


--
-- Name: cierrecaja cierrecaja_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cierrecaja
    ADD CONSTRAINT cierrecaja_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: detalle_venta detalle_venta_id_sucursal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_venta
    ADD CONSTRAINT detalle_venta_id_sucursal_fkey FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id) ON DELETE CASCADE;


--
-- Name: empresa empresa_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa
    ADD CONSTRAINT empresa_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: impresoras impresoras_id_caja_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.impresoras
    ADD CONSTRAINT impresoras_id_caja_fkey FOREIGN KEY (id_caja) REFERENCES public.caja(id) ON DELETE CASCADE;


--
-- Name: mesas mesas_id_salon_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mesas
    ADD CONSTRAINT mesas_id_salon_fkey FOREIGN KEY (id_salon) REFERENCES public.salones(id) ON DELETE CASCADE;


--
-- Name: metodos_pago metodos_pago_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metodos_pago
    ADD CONSTRAINT metodos_pago_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id) ON DELETE CASCADE;


--
-- Name: modificadores modificadores_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modificadores
    ADD CONSTRAINT modificadores_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id) ON DELETE CASCADE;


--
-- Name: movimientos_caja movimientos_caja_id_cierre_caja_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_id_cierre_caja_fkey FOREIGN KEY (id_cierre_caja) REFERENCES public.cierrecaja(id) ON DELETE CASCADE;


--
-- Name: movimientos_caja movimientos_caja_id_metodo_pago_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_id_metodo_pago_fkey FOREIGN KEY (id_metodo_pago) REFERENCES public.metodos_pago(id) ON DELETE CASCADE;


--
-- Name: movimientos_caja movimientos_caja_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: movimientos_caja movimientos_caja_id_ventas_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_id_ventas_fkey FOREIGN KEY (id_ventas) REFERENCES public.ventas(id) ON DELETE CASCADE;


--
-- Name: movimientos_stock movimientos_stock_id_almacen_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_stock
    ADD CONSTRAINT movimientos_stock_id_almacen_fkey FOREIGN KEY (id_almacen) REFERENCES public.almacen(id) ON DELETE CASCADE;


--
-- Name: movimientos_stock movimientos_stock_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos_stock
    ADD CONSTRAINT movimientos_stock_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: multiprecios multiprecios_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.multiprecios
    ADD CONSTRAINT multiprecios_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id);


--
-- Name: pagos_rapidos pagos_rapidos_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagos_rapidos
    ADD CONSTRAINT pagos_rapidos_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id) ON DELETE CASCADE;


--
-- Name: permisos_dafault permisos_dafault_id_modulo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos_dafault
    ADD CONSTRAINT permisos_dafault_id_modulo_fkey FOREIGN KEY (id_modulo) REFERENCES public.modulos(id) ON DELETE CASCADE;


--
-- Name: permisos_dafault permisos_dafault_id_rol_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos_dafault
    ADD CONSTRAINT permisos_dafault_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: permisos permisos_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: permisos permisos_idmodulo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permisos
    ADD CONSTRAINT permisos_idmodulo_fkey FOREIGN KEY (idmodulo) REFERENCES public.modulos(id) ON DELETE CASCADE;


--
-- Name: producto_modificadores producto_modificadores_id_modificador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto_modificadores
    ADD CONSTRAINT producto_modificadores_id_modificador_fkey FOREIGN KEY (id_modificador) REFERENCES public.modificadores(id) ON DELETE CASCADE;


--
-- Name: producto_modificadores producto_modificadores_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.producto_modificadores
    ADD CONSTRAINT producto_modificadores_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: categorias public_categorias_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT public_categorias_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id) ON DELETE CASCADE;


--
-- Name: clientes_proveedores public_clientes_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes_proveedores
    ADD CONSTRAINT public_clientes_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id) ON DELETE CASCADE;


--
-- Name: detalle_venta public_detalle_venta_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_venta
    ADD CONSTRAINT public_detalle_venta_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id);


--
-- Name: detalle_venta public_detalle_venta_id_venta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_venta
    ADD CONSTRAINT public_detalle_venta_id_venta_fkey FOREIGN KEY (id_venta) REFERENCES public.ventas(id) ON DELETE CASCADE;


--
-- Name: kardex public_kardex_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kardex
    ADD CONSTRAINT public_kardex_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: kardex public_kardex_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kardex
    ADD CONSTRAINT public_kardex_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id);


--
-- Name: productos public_productos_id_categoria_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT public_productos_id_categoria_fkey FOREIGN KEY (id_categoria) REFERENCES public.categorias(id) ON DELETE CASCADE;


--
-- Name: productos public_productos_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT public_productos_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id) ON DELETE CASCADE;


--
-- Name: ventas public_ventas_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT public_ventas_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.clientes_proveedores(id);


--
-- Name: salones salones_id_sucursal_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salones
    ADD CONSTRAINT salones_id_sucursal_fkey FOREIGN KEY (id_sucursal) REFERENCES public.sucursales(id) ON DELETE CASCADE;


--
-- Name: serializacion_comprobantes serializacion_comprobantes_id_tipo_comprobante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.serializacion_comprobantes
    ADD CONSTRAINT serializacion_comprobantes_id_tipo_comprobante_fkey FOREIGN KEY (id_tipo_comprobante) REFERENCES public.tipo_comprobantes(id) ON DELETE CASCADE;


--
-- Name: serializacion_comprobantes serializacion_comprobantes_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.serializacion_comprobantes
    ADD CONSTRAINT serializacion_comprobantes_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES public.sucursales(id) ON DELETE CASCADE;


--
-- Name: stock stock_id_almacen_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT stock_id_almacen_fkey FOREIGN KEY (id_almacen) REFERENCES public.almacen(id) ON DELETE CASCADE;


--
-- Name: stock stock_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT stock_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: sucursales sucursales_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sucursales
    ADD CONSTRAINT sucursales_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id) ON DELETE CASCADE;


--
-- Name: tipodocumento tipodocumento_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipodocumento
    ADD CONSTRAINT tipodocumento_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id) ON DELETE CASCADE;


--
-- Name: usuarios usuarios_id_empresa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_id_empresa_fkey FOREIGN KEY (id_empresa) REFERENCES public.empresa(id) ON DELETE CASCADE;


--
-- Name: usuarios usuarios_id_rol_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES public.roles(id);


--
-- Name: ventas ventas_id_cierre_caja_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_id_cierre_caja_fkey FOREIGN KEY (id_cierre_caja) REFERENCES public.cierrecaja(id) ON DELETE CASCADE;


--
-- Name: ventas ventas_id_mesa_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_id_mesa_fkey FOREIGN KEY (id_mesa) REFERENCES public.mesas(id);


--
-- Name: ventas ventas_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: categorias Enable delete for users based on user_id; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for users based on user_id" ON public.categorias FOR DELETE TO authenticated USING ((id = id));


--
-- Name: categorias Enable insert for authenticated users only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for authenticated users only" ON public.categorias FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: categorias Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.categorias FOR SELECT TO authenticated USING (true);


--
-- Name: categorias Enable update for users based on email; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for users based on email" ON public.categorias FOR UPDATE TO authenticated USING ((id = id)) WITH CHECK ((id = id));


--
-- Name: categorias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;

--
-- Name: modificadores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.modificadores ENABLE ROW LEVEL SECURITY;

--
-- Name: multiprecios; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.multiprecios ENABLE ROW LEVEL SECURITY;

--
-- Name: producto_modificadores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.producto_modificadores ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




-- ============================================================================
--  2. OVERRIDES DE FUNCIONES  (posteriores al volcado de pg_dump)
-- ============================================================================

-- ----------------------------------------------------------------------------
--  insertarpermisohome()
--  Trigger AFTER INSERT ON public.usuarios.
--
--  Antes: al alta de un usuario NO superadmin solo insertaba el módulo con
--         link '/' (Home) en `permisos`.
--  Ahora: además copia a `permisos` TODAS las filas de `permisos_dafault`
--         del rol del usuario (permisos base del rol, materializados por
--         usuario). Superadmin se ignora (acceso total implícito). Es
--         idempotente: no duplica filas si el permiso ya existe.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.insertarpermisohome()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_es_superadmin boolean;
begin
  -- Sin rol asignado: nada que sembrar.
  if new.id_rol is null then
    return new;
  end if;

  select lower(r.nombre) = 'superadmin'
    into v_es_superadmin
  from roles r
  where r.id = new.id_rol;

  -- El superadmin no lleva filas en permisos_dafault ni en permisos:
  -- el sistema lo trata como acceso total.
  if coalesce(v_es_superadmin, false) then
    return new;
  end if;

  -- 1) Módulo Home / dashboard (link = '/').
  insert into permisos (id_usuario, idmodulo)
  select new.id, m.id
  from modulos m
  where m.link = '/'
    and not exists (
      select 1 from permisos p
      where p.id_usuario = new.id and p.idmodulo = m.id
    );

  -- 2) Permisos por defecto del rol (permisos_dafault) materializados.
  insert into permisos (id_usuario, idmodulo)
  select new.id, pd.id_modulo
  from permisos_dafault pd
  where pd.id_rol = new.id_rol
    and pd.id_modulo is not null
    and not exists (
      select 1 from permisos p
      where p.id_usuario = new.id and p.idmodulo = pd.id_modulo
    );

  return new;
end;
$function$;

-- ----------------------------------------------------------------------------
--  Limpieza: handle_new_user() es código muerto (referencia una tabla
--  `usuario_empresa` que no existe y ningún trigger la usa). El flujo vivo
--  es auth.users -> crear_empresa_personalizada() -> empresa -> insertpordefecto().
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.handle_new_user();


-- ============================================================================
--  3. ESQUEMA auth  ·  trigger de alta de usuario
--     pg_dump --schema=public NO incluye objetos de auth. GoTrue administra
--     las TABLAS de auth en el proyecto destino; aquí solo se (re)crea el
--     trigger que engancha el alta de auth.users con la lógica de negocio.
--
--     Flujo: INSERT auth.users
--            -> crear_empresa_personalizada()
--               · si el correo ya existe en public.usuarios (invitado por un
--                 admin): solo vincula id_auth.
--               · si no: INSERT en public.empresa -> dispara pordefectotrigger
--                 -> insertpordefecto() crea usuario superadmin, permisos,
--                    sucursal, almacén, caja, salón, mesas, categoría,
--                    producto demo, cliente genérico, métodos de pago y
--                    pagos rápidos.
-- ============================================================================

DROP TRIGGER IF EXISTS insertar_empresa_personalizada ON auth.users;
CREATE TRIGGER insertar_empresa_personalizada
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.crear_empresa_personalizada();

-- Triggers antiguos que ya no se usan (por si el proyecto destino los tuviera).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;


-- ============================================================================
--  4. SEMILLA DE CATÁLOGOS GLOBALES  (idempotente · ON CONFLICT DO NOTHING)
--     roles · modulos · permisos_dafault · tipo_comprobantes
--     Datos tal cual en el proyecto origen al 2026-08-31.
-- ============================================================================
SET search_path TO 'public';

INSERT INTO public.modulos (id, nombre, "check", descripcion, icono, link, etiquetas) VALUES
	(19, 'Empresa basicos', false, '-', '-', '/configurar/empresa', '#operacion'),
	(20, 'Empresa moneda', false, '-', '-', '/configurar/empresa', '#operacion'),
	(24, 'Configuración de ticket', false, 'configura tu ticket personalizado', 'https://i.ibb.co/Z1BQHJ92/boleto.png', '/configurar/empresa', '#configuracion'),
	(26, 'Reportes', false, 'ventas, productos, mesas, metodos de pago y usuarios', '-', '/configurar/reportes', '#configuracion'),
	(27, 'Modificadores', false, 'opciones extra para productos', '-', '/configurar/modificadores', '#configuracion'),
	(28, 'Pagos rapidos', false, 'botones de cobro rapido en efectivo', '-', '/configurar/pagos_rapidos', '#configuracion'),
	(29, 'Salones y mesas', false, 'gestiona salones y mesas', '-', '/configurar/mesas', '#configuracion'),
	(16, 'Tomar pedidos', false, '-', '-', '/punto-venta', '#operacion'),
	(18, 'Cobrar venta', false, '-', '-', '-', '#operacion'),
	(9, 'Impresoras', false, 'gestiona tus comprobantes de pago', 'https://qkzybkelsdmoezaaypou.supabase.co/storage/v1/object/public/imagenes/modulos/impresora.png', '/configuracion/impresoras', '#configuracion'),
	(21, 'Almacenes', false, 'gestiona tus almacenes por sucursales', 'https://qkzybkelsdmoezaaypou.supabase.co/storage/v1/object/public/imagenes/modulos/almacen.png', '/configuracion/almacenes', '#configuracion'),
	(22, 'Home', false, '-', '-', '/', '#default'),
	(23, 'Inventarios', false, '-', '-', '/inventario', '#operacion'),
	(25, 'Serialización de comprobantes', false, 'serializa tus comprobantes', 'https://i.ibb.co/xtCdPGhx/factura-2.png', '/configuracion/serializacion', '#configuracion'),
	(1, 'Categorias de productos', false, 'asigna categorias a tus productos', 'https://i.ibb.co/VYbMRLZ/categoria.png', '/configurar/categorias', '#configuracion'),
	(2, 'Productos', false, 'registra tus productos', 'https://i.ibb.co/85zJ6yG/caja-del-paquete.png', '/configurar/productos', '#configuracion'),
	(3, 'Empresa', false, 'configura tu empresa', 'https://i.ibb.co/S0pkQWF/comercio-y-compras.png', '/configurar/empresa', '#configuracion'),
	(4, 'Clientes', false, 'gestiona tus clientes', 'https://i.ibb.co/g4YBrpf/satisfecho.png', '/configurar/clientes', '#configuracion'),
	(5, 'Proveedores', false, 'gestiona tus proveedores', 'https://i.ibb.co/q5rjxjG/proveedor.png', '/configurar/clientes', '#configuracion'),
	(6, 'Métodos de pago', false, 'gestiona tus métodos de pago', 'https://i.ibb.co/PtjvQkB/transferencia-movil.png', '/configurar/metodos_pago', '#configuracion'),
	(7, 'Sucursales y cajas', false, 'gestiona tus sucursales y cajas', 'https://qkzybkelsdmoezaaypou.supabase.co/storage/v1/object/public/imagenes/modulos/sucursales.png?t=2024-12-01T12%3A56%3A08.233Z', '/configurar/sucursales_cajas', '#configuracion'),
	(8, 'Usuarios', false, 'gestiona tus usuarios', 'https://qkzybkelsdmoezaaypou.supabase.co/storage/v1/object/public/imagenes/modulos/escritorio-de-oficina.png?t=2024-12-01T12%3A58%3A35.579Z', '/configurar/usuarios', '#configuracion'),
	(15, 'Configuracion', false, '-', '-', '/configurar', '#operacion'),
	(17, 'Dashboard', false, '-', '-', '/', '#operacion') ON CONFLICT DO NOTHING;
INSERT INTO public.roles (id, nombre) VALUES
	(1, 'superadmin'),
	(2, 'cajero'),
	(3, 'admin'),
	(6, 'mozo') ON CONFLICT DO NOTHING;
INSERT INTO public.permisos_dafault (id, id_rol, id_modulo) VALUES
	(1, 2, 2),
	(2, 3, 3),
	(3, 2, 7),
	(33, 1, 19),
	(34, 1, 20),
	(35, 1, 24),
	(36, 1, 26),
	(37, 1, 27),
	(38, 1, 28),
	(39, 1, 29),
	(40, 1, 18),
	(41, 1, 9),
	(42, 1, 21),
	(43, 1, 22),
	(44, 1, 23),
	(45, 1, 25),
	(46, 1, 1),
	(47, 1, 2),
	(48, 1, 3),
	(49, 1, 4),
	(50, 1, 5),
	(51, 1, 6),
	(52, 1, 7),
	(53, 1, 8),
	(54, 1, 15),
	(55, 1, 16),
	(56, 1, 17),
	(57, 6, 16) ON CONFLICT DO NOTHING;
INSERT INTO public.tipo_comprobantes (id, nombre, destino) VALUES
	(1, 'Factura', 'ventas'),
	(2, 'Boleta', 'ventas'),
	(4, 'Nota de debito', '-'),
	(5, 'Ticket', 'ventas'),
	(3, 'Nota de credito', '-') ON CONFLICT DO NOTHING;
SELECT pg_catalog.setval('public.modulos_id_seq', 29, true);
SELECT pg_catalog.setval('public.permisos_dafault_id_seq', 58, true);
SELECT pg_catalog.setval('public.roles_id_seq', 6, true);
SELECT pg_catalog.setval('public.tipo_comprobantes_id_seq', 5, true);

-- ---- Módulo "Deudores" (migration_modulo_deudores.sql) --------------------
--  No estaba en `modulos` del origen; se agrega para habilitarlo por rol.
INSERT INTO public.modulos (nombre, descripcion, icono, link, "check", etiquetas)
SELECT 'Deudores',
       'Seguimiento a clientes con deuda (fiado) y registro de pagos',
       'DEU',
       '/configurar/deudores',
       true,
       '#configuracion'
WHERE NOT EXISTS (
  SELECT 1 FROM public.modulos WHERE link = '/configurar/deudores'
);

-- Resincroniza las secuencias de identidad por si el INSERT condicional
-- de arriba consumió un id, o si la base destino ya tenía filas.
SELECT pg_catalog.setval('public.modulos_id_seq',            (SELECT COALESCE(MAX(id), 1) FROM public.modulos),            true);
SELECT pg_catalog.setval('public.roles_id_seq',              (SELECT COALESCE(MAX(id), 1) FROM public.roles),              true);
SELECT pg_catalog.setval('public.permisos_dafault_id_seq',   (SELECT COALESCE(MAX(id), 1) FROM public.permisos_dafault),   true);
SELECT pg_catalog.setval('public.tipo_comprobantes_id_seq',  (SELECT COALESCE(MAX(id), 1) FROM public.tipo_comprobantes),  true);


-- ============================================================================
--  5. PRIVILEGIOS  ·  anon / authenticated / service_role  (PostgREST)
--     pg_dump se generó con --no-privileges. En Supabase los privilegios por
--     defecto del esquema public re-otorgan solos al crear objetos como
--     `postgres`, pero se hacen explícitos aquí para restauraciones fuera de
--     ese camino feliz.
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES     IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES  IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS  IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

COMMIT;

-- ============================================================================
--  FIN
-- ============================================================================
