// src/shared/api/usuarios.api.ts
import { supabase } from "@/shared/utils/supabase";
import type {
  Usuarios,
  Roles,
  Modulos,
  Permisos,
  PermisosDefault,
} from "@/shared/types/db/tablas";

const TABLA_USUARIOS = "usuarios";
const TABLA_ROLES = "roles";
const TABLA_MODULOS = "modulos";
const TABLA_PERMISOS = "permisos";
// ⚠️ el nombre real en BD tiene un typo histórico ("dafault", no "default") — no lo
// corrijas a "permisos_default" sin renombrar también la tabla en Supabase.
const TABLA_PERMISOS_DEFAULT = "permisos_dafault";

/** ---------------- USUARIOS CRUD ---------------- */
export type InsertarUsuarioPayload = Omit<Partial<Usuarios>, "id">;

export const insertarUsuario = async (p: InsertarUsuarioPayload) => {
  const { data, error } = await supabase
    .from(TABLA_USUARIOS)
    .insert(p)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Usuarios;
};

export type EditarUsuarioPayload = Pick<
  Usuarios,
  | "id"
  | "nombres"
  | "telefono"
  | "correo"
  | "estado"
  | "tema"
  | "nro_doc"
  | "id_tipodocumento"
  | "id_rol"
>;

export const editarUsuario = async (p: EditarUsuarioPayload) => {
  const { data, error } = await supabase
    .from(TABLA_USUARIOS)
    .update(p)
    .eq("id", p.id);
  if (error) throw new Error(error.message);
  return data;
};

export type EditarTemaUsuarioPayload = Pick<Usuarios, "id" | "tema">;

export const editarTemaUsuario = async (p: EditarTemaUsuarioPayload) => {
  const { error } = await supabase
    .from(TABLA_USUARIOS)
    .update({ tema: p.tema })
    .eq("id", p.id);
  if (error) throw new Error(error.message);
  return true;
};

export const eliminarUsuario = async (id: Usuarios["id"]) => {
  const { error } = await supabase.from(TABLA_USUARIOS).delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
};

export const mostrarUsuariosPorEmpresa = async (id_empresa: number) => {
  const { data, error } = await supabase
    .from(TABLA_USUARIOS)
    .select("*, roles(*)")
    .eq("id_empresa", id_empresa)
    .order("id", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Usuarios[];
};
// El correo puede repetirse (una persona puede tener una fila invitada en
// una empresa y otra propia en otra) — por eso NO usa maybeSingle() acá,
// eso truena apenas hay 2 filas. Devuelve la primera que encuentre, solo
// para chequeos informativos ("¿este correo ya existe?").
export const mostrarUsuariosPorEmail = async (correo: Usuarios["correo"]) => {
  const { data, error } = await supabase
    .from(TABLA_USUARIOS)
    .select("*,roles(*)")
    .eq("correo", correo)
    .limit(1);
  if (error) throw new Error(error.message);
  return data?.[0] ?? null;
};

// La fila real de ESTA sesión: id_auth sí es único de verdad (constraint en
// BD), así que este es el único lookup seguro para "quién soy yo" cuando
// puede haber correos duplicados en la tabla.
export const mostrarUsuarioPorAuth = async (id_auth: Usuarios["id_auth"]) => {
  const { data, error } = await supabase
    .from(TABLA_USUARIOS)
    .select("*,roles(*)")
    .eq("id_auth", id_auth)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
};

// Invitación esperando dueño: fila con este correo que todavía nadie
// reclamó (id_auth NULL). Se usa como red de seguridad en
// EnsureEmpresaForUser para no crear una empresa nueva cuando en realidad
// la persona ya tenía una invitación pendiente (caso: la invitación se creó
// DESPUÉS de que esta identidad de Google ya existiera en auth.users, así
// que el trigger de auth.users nunca llegó a vincularla).
export const buscarInvitacionPendientePorCorreo = async (
  correo: string,
) => {
  const { data, error } = await supabase
    .from(TABLA_USUARIOS)
    .select("id, correo, id_auth")
    .is("id_auth", null)
    .ilike("correo", correo.trim())
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
};

export const vincularUsuarioConAuth = async (
  id: Usuarios["id"],
  id_auth: string,
) => {
  const { error } = await supabase
    .from(TABLA_USUARIOS)
    .update({ id_auth })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return true;
};

export const buscarUsuarios = async (texto: string) => {
  const q = texto.trim();
  if (!q) {
    const { data, error } = await supabase
      .from(TABLA_USUARIOS)
      .select("*")
      .order("id", { ascending: false });
    if (error) throw new Error(error.message);
    return data as Usuarios[];
  }

  const { data, error } = await supabase
    .from(TABLA_USUARIOS)
    .select("*")
    .or(`nombres.ilike.%${q}%,correo.ilike.%${q}%,nro_doc.ilike.%${q}%`)
    .limit(20);

  if (error) throw new Error(error.message);
  return data as Usuarios[];
};

/** ---------------- CATÁLOGOS ---------------- */

export const mostrarRoles = async () => {
  const { data, error } = await supabase
    .from(TABLA_ROLES)
    .select("*")
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return data as Roles[];
};

export const mostrarModulos = async () => {
  const { data, error } = await supabase
    .from(TABLA_MODULOS)
    .select("*")
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return data as Modulos[];
};

export const mostrarPermisosDefaultPorRol = async (id_rol: Roles["id"]) => {
  const { data, error } = await supabase
    .from(TABLA_PERMISOS_DEFAULT)
    .select("id, id_rol, id_modulo")
    .eq("id_rol", id_rol);

  if (error) throw new Error(error.message);
  return data as PermisosDefault[];
};

export const mostrarPermisosPorUsuario = async (id_usuario: Usuarios["id"]) => {
  const { data, error } = await supabase
    .from(TABLA_PERMISOS)
    .select("id, id_usuario, idmodulo")
    .eq("id_usuario", id_usuario);
  if (error) throw new Error(error.message);
  return data as Permisos[];
};

/** ---------------- PERMISOS (SIN COLUMNAS EXTRA) ----------------
 * Regla:
 * - permisos_default = base por rol
 * - permisos (usuario) = solo "extras"
 * - No se puede "quitar" un permiso que viene del rol (porque tu esquema no tiene allow=false)
 *
 * El rol en sí (id_rol) se guarda con editarUsuario/insertarUsuario. Esta
 * función solo guarda los permisos "extra" del usuario.
 */

export type GuardarPermisosUsuarioPayload = {
  id_usuario: Usuarios["id"];
  id_rol: Roles["id"]; // solo para invalidar el catálogo de permisos base de ese rol
  extras_modulos_ids: number[]; // módulos extra (además del rol)
};

export const guardarRolYPermisosUsuario = async (
  p: GuardarPermisosUsuarioPayload,
) => {
  // 1) borrar permisos extras existentes
  const { error: e1 } = await supabase
    .from(TABLA_PERMISOS)
    .delete()
    .eq("id_usuario", p.id_usuario);
  if (e1) throw new Error(e1.message);

  // 2) insertar extras (si hay)
  if (p.extras_modulos_ids.length > 0) {
    const rows = p.extras_modulos_ids.map((idmodulo) => ({
      id_usuario: p.id_usuario,
      idmodulo,
    }));
    const { error: e2 } = await supabase.from(TABLA_PERMISOS).insert(rows);
    if (e2) throw new Error(e2.message);
  }

  return true;
};
