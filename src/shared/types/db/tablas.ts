// Tipado BD POS (Supabase/Postgres)
// PK bigint => en TS lo manejamos como number (si te preocupa precisión: usa string)
export type ID = number;
export type FechaISO = string;
export type Numeric = number | string;

// ==============================
// Empresa / Sucursal
// ==============================
export type Empresas = {
  id: ID;
  nombre: string;
  id_fiscal: string | null;
  direccion_fiscal: string | null;
  simbolo_moneda: string | null;
  logo: string | null;
  id_auth: string; // tu "auth id" guardado como text
  id_usuario: ID | null;
  iso: string | null;
  pais: string | null;
  currency: string | null;
  impuesto: string | null;
  valor_impuesto: Numeric | null; // default 18
  nombre_moneda: string | null;
  correo: string | null;
  pie_pagina_ticket: string | null;
};

export type Sucursales = {
  id: ID;
  nombre: string | null;
  direccion_fiscal: string | null;
  id_empresa: ID | null;
  delete: boolean | null;
};

export type Almacenes = {
  id: ID;
  id_sucursal: ID;
  fecha_creacion: FechaISO | null; // timestamp
  delete: boolean | null;
  nombre: string | null;
  default: boolean | null;
};

// ==============================
// Usuarios / Roles / Permisos
// ==============================
export type Roles = {
  id: ID;
  nombre: string;
};
export type PermisosDefault ={
  id:ID;
  id_rol:ID;
  id_modulo:ID
}
export type TiposDocumentos = {
  id: ID;
  nombre: string;
  id_empresa: ID | null;
};

export type Usuarios = {
  id: ID;
  nombres: string;
  id_tipodocumento: ID | null;
  nro_doc: string | null;
  telefono: string | null;
  id_rol: ID | null;
  id_empresa: ID | null;
  correo: string | null;
  fecharegistro: string | null; // date
  estado: string | null;
  id_auth: string | null;
  tema: string | null; // light/dark
};

export type Modulos = {
  id: ID;
  nombre: string;
  check: boolean | null;
  descripcion: string | null;
  icono: string | null;
  link: string | null;
  etiquetas: string | null;
};

export type Permisos = {
  id: ID;
  id_usuario: ID;
  idmodulo: ID | null;
};

export type PermisosDefaults = {
  id: ID;
  id_rol: ID;
  id_modulo: ID;
};

// ==============================
// Caja / Cierre / Metodos de pago
// ==============================
export type Cajas = {
  id: ID;
  descripcion: string;
  id_sucursal: ID | null;
  fecha_creacion: FechaISO | null;
  delete: boolean | null;
  print: boolean | null;
};

export type CierresCajas = {
  id: ID;
  fechainicio: FechaISO | null;
  fechacierre: FechaISO | null;
  id_usuario: number | null; // en tu tabla es integer
  total_efectivo_calculado: Numeric | null;
  total_efectivo_real: Numeric | null;
  estado: ID | null; // bigint default 0
  diferencia_efectivo: Numeric | null;
  id_caja: number | null; // integer
};

export type MetodosPagos = {
  id: ID;
  nombre: string;
  id_empresa: ID | null;
  delete_update: boolean | null;
  default: boolean | null;
  state: boolean | null;
};

export type PagosRapidos = {
  id: ID;
  id_empresa: ID | null;
  monto: Numeric;
  es_exacto: boolean;
  orden: number;
  state: boolean | null;
};

export type MovimientosCajas = {
  id: ID;
  fecha_movimiento: FechaISO;
  tipo_movimiento: string | null;
  monto: Numeric | null;
  id_metodo_pago: ID | null;
  descripcion: string | null;
  id_usuario: ID | null;
  id_cierre_caja: ID | null;
  id_ventas: ID | null;
  vuelto: Numeric | null;
};

export type Impresoras = {
  id: ID;
  id_caja: ID;
  pc_name: string | null;
  ip_local: string | null;
  state: boolean | null;
  name: string | null;
};

// ==============================
// Productos / Categorias / Stock
// ==============================
export type Categorias = {
  id: ID;
  nombre: string;
  color: string | null;
  icono: string | null;
  id_empresa: ID | null;
};

export type Productos = {
  id: ID;
  nombre: string;
  precio_venta: Numeric | null;
  precio_compra: Numeric | null;
  id_categoria: ID | null;
  id_empresa: ID | null;
};

export type MultiPrecios = {
  id: ID;
  precio_venta: Numeric;
  id_producto: ID | null;
  cantidad: Numeric | null;
};

export type Stocks = {
  id: ID;
  id_almacen: ID;
  id_producto: ID | null;
  stock: Numeric | null;
  stock_minimo: Numeric | null;
  ubicacion: string | null;
};

export type MovimientosStocks = {
  id: ID;
  id_almacen: ID;
  id_producto: ID | null;
  tipo_movimiento: string | null;
  cantidad: Numeric | null;
  fecha: FechaISO | null; // timestamptz
  detalle: string | null;
  origen: string | null;
};

export type Kardexs = {
  id: ID;
  fecha: string; // date
  motivo: string | null;
  cantidad: Numeric | null;
  id_producto: ID | null;
  id_usuario: ID | null;
  tipo: string | null;
  estado: string | null;
  total: Numeric | null;
  costo: Numeric | null;
  habia: Numeric | null;
  hay: Numeric | null;
};

// ==============================
// Clientes / Proveedores
// ==============================
export type ClientesProveedores = {
  id: ID;
  nombres: string;
  id_empresa: ID | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  identificador_nacional: string | null;
  identificador_fiscal: string | null;
  tipo: string | null; // cliente/proveedor/'-'
  estado: string | null; // activo
  fecha_registro: FechaISO | null;
};

// ==============================
// Ventas
// ==============================
export type VentasEstados = "pendiente"  | string;

export type Ventas = {
  id: ID;
  fecha: FechaISO; // timestamp
  monto_total: Numeric | null;
  total_impuestos: Numeric | null;
  id_usuario: ID | null;
  saldo: Numeric | null;
  pago_con: Numeric | null;
  referencia_tarjeta: string | null;
  vuelto: Numeric | null;
  cantidad_productos: ID | null; // bigint
  sub_total: Numeric | null;
  id_cliente: ID | null;
  id_sucursal: ID | null;
  id_empresa: ID | null;
  estado: VentasEstados | null;
  valor_impuesto: Numeric | null;
  id_cierre_caja: ID | null;
  nro_comprobante: string | null; // uuid string generado
  id_mesa: number;
  id_metodo_pago:ID | null
  nombre_ref: string | null;
  propina: Numeric | null;
};

export type ModificadorSeleccionado = {
  id_modificador: ID;
  nombre: string;
  precio_extra: Numeric;
};

export type DetallesVentas = {
  id: ID;
  id_venta: ID;
  cantidad: Numeric | null;
  precio_venta: Numeric | null;
  total: Numeric | null;
  descripcion: string | null;
  id_producto: ID | null;
  precio_compra: Numeric | null;
  id_sucursal: ID | null;
  estado: string | null; // nueva
  id_almacen: ID | null;
  nota: string | null;
  prioridad: number | null;
  modificadores: ModificadorSeleccionado[] | null;
};
export type DetalleVentasRpc = {
  _id_venta: number;
  _cantidad: number; // o string si usas numeric como string
  _precio_venta: number;
  _id_producto: number;
  _precio_compra: number;
  _descripcion: string | null;
  _id_sucursal: number;
  _id_almacen: number;
  _modificadores?: ModificadorSeleccionado[];
};

// ==============================
// Modificadores de producto
// ==============================
export type Modificadores = {
  id: ID;
  id_empresa: ID | null;
  nombre: string;
  precio_extra: Numeric;
  state: boolean | null;
};

export type ProductoModificadores = {
  id: ID;
  id_producto: ID;
  id_modificador: ID;
};

export type ProductoModificadorRow = ProductoModificadores & {
  modificadores: Modificadores | null;
};

export type TiposComprobantes = {
  id: ID;
  nombre: string;
  destino: string | null;
};
export type DetalleVentaRow = DetallesVentas & {
  ventas: Ventas | null;
  productos: Productos | null;
};
export type SerializacionesComprobantes = {
  id: ID;
  id_tipo_comprobante: ID;
  serie: string | null;
  cantidad_numeros: ID | null;
  correlativo: ID | null;
  sucursal_id: ID | null;
  por_default: boolean | null;
};

// ==============================
// Asignaciones
// ==============================
export type AsignacionesSucursales = {
  id: ID;
  id_sucursal: ID;
  id_usuario: ID | null;
  id_caja: ID | null;
};

// ==============================
// RPC RETURNS (los más usados)
// ==============================
export type RpcMostrarDetallesVentasRows = {
  producto: string;
  precio_venta: Numeric;
  cantidad: Numeric;
  estado: string;
  total: Numeric;
  id: ID; // id del detalle_venta
};

export type RpcBuscarProductosRows = {
  id: ID;
  nombre: string;
  precio_venta: Numeric;
  precio_compra: Numeric;
  id_categoria: ID;
  sevende_por: string;
  codigo_barras: string | null;
  codigo_interno: string | null;
  id_empresa: ID;
  maneja_inventarios: boolean;
  maneja_multiprecios: boolean;
  p_venta: string;
  p_compra: string;
  categoria: string;
};

export type Salones = {
  id: ID;
  nombre: string;
  id_sucursal: ID; // FK -> sucursales.id
};

export type Mesas = {
  id: ID;
  nombre: string;
  id_salon: ID; // FK -> salones.id
  posicion?: {
    x: number; // Porcentaje de 0 a 100
    y: number; // Porcentaje de 0 a 100
  };
  estado: string;
};

// Compat aliases for legacy modules still importing old names.
export type BmSucursales = Sucursales;
export type BmSalones = Salones;
export type BmMesa = Mesas;
