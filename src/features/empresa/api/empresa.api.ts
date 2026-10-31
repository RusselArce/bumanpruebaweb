import { Empresas } from "@/shared/types/db/tablas";
import { supabase } from "@/shared/utils/supabase";
import { mostrarAsignacionesPorAuth } from "@/features/asignacion_sucursal/api/asignacion_sucursal";
import { mostrarSucursalPorIdUsuario } from "@/features/sucursales/api/sucursales";
import {
  buscarInvitacionPendientePorCorreo,
  vincularUsuarioConAuth,
} from "@/features/usuarios/api/usuarios.api";

const tabla = "empresa";
export async function InsertarEmpresa(p: Omit<Partial<Empresas>, "id">) {
  const { data, error } = await supabase
    .from(tabla)
    .insert(p)
    .select()
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function ObtenerEmpresaPorAuth(id_auth: string) {
  const { data, error } = await supabase
    .from(tabla)
    .select("*")
    .eq("id_auth", id_auth)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data; // null si no existe
}

export type ActualizarEmpresaPayload = Pick<Empresas, "id"> &
  Partial<Omit<Empresas, "id">>;

export async function ActualizarEmpresa(p: ActualizarEmpresaPayload) {
  const { data, error } = await supabase
    .from(tabla)
    .update({
      nombre: p.nombre,
      direccion_fiscal: p.direccion_fiscal,
      impuesto: p.impuesto,
      valor_impuesto: p.valor_impuesto,
      iso: p.iso,
      pais: p.pais,
      currency: p.currency,
      nombre_moneda: p.nombre_moneda,
      simbolo_moneda: p.simbolo_moneda,
      logo: p.logo,
      correo: p.correo,
      pie_pagina_ticket: p.pie_pagina_ticket,
    })
    .eq("id", p.id)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

const BUCKET_IMAGENES = "imagenes";

// ✅ el nombre del archivo es el id de la empresa (bucket "imagenes",
// carpeta "empresa") — upsert para que subir una foto nueva reemplace la
// anterior en vez de acumular archivos sueltos. El "?v=" al final es solo
// para que el navegador no siga mostrando la versión vieja en caché.
export async function subirLogoEmpresa(id: Empresas["id"], file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `empresa/${id}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_IMAGENES)
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from(BUCKET_IMAGENES).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

// ✅ ahora una identidad puede tener varias asignaciones (una por
// sucursal/empresa a la que pertenece) — se devuelven todas, y quién elige
// cuál queda "activa" es el store (última elegida, o la única si solo hay
// una). El alta real de una identidad 100% nueva la hace el trigger
// `crear_empresa_personalizada` en Postgres (dispara en el INSERT de
// auth.users); el insert de acá abajo es un respaldo legado para el caso
// de que no exista ninguna asignación todavía.
//
// ⚠️ Antes de crear empresa, primero chequea si hay una invitación
// pendiente (usuarios.id_auth NULL) con este correo. Hace falta porque el
// trigger de auth.users solo vincula cuando la identidad de Google se crea
// DESPUÉS de la invitación — si alguien ya tenía sesión iniciada y lo
// invitás recién ahora, el trigger no se vuelve a disparar y sin este
// chequeo el fallback de acá le crea una empresa nueva de cero en vez de
// vincularlo a la invitación que le hicieron (bug real, visto en
// producción: mozo invitado a una empresa terminó como "dueño" de una
// empresa fantasma).
export async function EnsureEmpresaForUser(user: {
  id: string;
  email?: string | null;
}) {
  if (!user?.id) return [];

  const asignaciones = await mostrarAsignacionesPorAuth(user.id);
  if (asignaciones.length > 0) return asignaciones;

  if (user.email) {
    const invitacionPendiente = await buscarInvitacionPendientePorCorreo(
      user.email,
    );
    if (invitacionPendiente) {
      await vincularUsuarioConAuth(invitacionPendiente.id, user.id);
      return await mostrarAsignacionesPorAuth(user.id);
    }
  }

  await InsertarEmpresa({
    id_auth: user.id,
    correo: user.email ?? null,
    nombre: "Empresa",
  });
  return [];
}


