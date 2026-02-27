// ============================================================
// TIPOS TYPESCRIPT — Sistema RP
// ============================================================

export interface Servidor {
    id: string
    nombre: string
    codigo: string
    descripcion?: string
    activo: boolean
    created_at: string
}

export interface Usuario {
    id: string
    servidor_id: string
    username: string
    nombre: string
    email?: string
    placa?: string
    rango?: string
    rol: string
    activo: boolean
    avatar_url?: string
    ultimo_acceso?: string
    created_at: string
    servidores?: Servidor
}

export interface RolPermiso {
    id: string
    servidor_id: string
    nombre_rol: string
    color: string
    jerarquia: number
    // 👤 USUARIOS
    puede_banear: boolean
    puede_advertir: boolean
    puede_gestionar_usuarios: boolean
    puede_ver_usuarios: boolean
    puede_crear_usuarios: boolean
    puede_editar_usuarios: boolean
    puede_eliminar_usuarios: boolean
    // 🏦 ECONOMÍA
    puede_ver_economia: boolean
    puede_dar_dinero: boolean
    puede_quitar_dinero: boolean
    puede_transferir_dinero: boolean
    puede_ver_transacciones: boolean
    puede_crear_cuentas: boolean
    // 🏪 NEGOCIOS
    puede_crear_negocios: boolean
    puede_editar_negocios: boolean
    puede_eliminar_negocios: boolean
    puede_ver_negocios: boolean
    puede_gestionar_stock: boolean
    puede_emitir_facturas: boolean
    // 🚗 VEHÍCULOS
    puede_ver_vehiculos: boolean
    puede_crear_vehiculos: boolean
    puede_editar_vehiculos: boolean
    puede_eliminar_vehiculos: boolean
    puede_transferir_vehiculos: boolean
    // 🚔 POLICÍA / MDT
    puede_ver_mdt: boolean
    puede_editar_mdt: boolean
    puede_emitir_multas: boolean
    puede_arrestar: boolean
    puede_ver_citizen: boolean
    puede_editar_citizen: boolean
    puede_buscar_personas: boolean
    // 🏥 MÉDICO
    puede_ver_pacientes: boolean
    puede_tratar_pacientes: boolean
    puede_emitir_recetas: boolean
    puede_ver_historial: boolean
    // 📋 LICENCIAS
    puede_emitir_licencias: boolean
    puede_revocar_licencias: boolean
    puede_ver_licencias: boolean
    // 📦 INVENTARIO
    puede_gestionar_inventario: boolean
    puede_ver_inventario: boolean
    puede_agregar_items: boolean
    puede_eliminar_items: boolean
    // 🔍 AUDITORÍA
    puede_ver_auditoria: boolean
    puede_ver_logs: boolean
    puede_exportar_datos: boolean
    // ⚙️ ADMINISTRACIÓN
    puede_gestionar_roles: boolean
    puede_crear_roles: boolean
    puede_editar_roles: boolean
    puede_eliminar_roles: boolean
    puede_ver_config: boolean
    puede_editar_config: boolean
    // 🌐 SERVIDOR
    puede_ver_consola: boolean
    puede_ejecutar_comandos: boolean
    puede_gestionar_plugins: boolean
    puede_ver_recursos: boolean
}

export interface Personaje {
    id: string
    usuario_id?: string
    servidor_id: string
    nombre: string
    apellidos: string
    dni: string
    fecha_nacimiento?: string
    nacionalidad?: string
    genero?: string
    foto_url?: string
    huella_url?: string
    vivo: boolean
    en_prision: boolean
    buscado: boolean
    historial_medico: any[]
    antecedentes_penales: any[]
    notas?: string
    created_at: string
}

export interface CuentaBancaria {
    id: string
    personaje_id: string
    servidor_id: string
    numero_cuenta: string
    dinero_mano: number
    dinero_banco: number
    limite_credito: number
    created_at: string
    personajes?: Personaje
}

export interface Transaccion {
    id: string
    servidor_id: string
    cuenta_origen_id?: string
    cuenta_destino_id?: string
    tipo: string
    cantidad: number
    descripcion?: string
    referencia?: string
    creado_por?: string
    created_at: string
}

export interface Negocio {
    id: string
    servidor_id: string
    dueno_personaje_id?: string
    nombre: string
    tipo: string
    descripcion?: string
    direccion?: string
    dinero_caja: number
    activo: boolean
    logo_url?: string
    created_at: string
    personajes?: Personaje
}

export interface NegocioEmpleado {
    id: string
    negocio_id: string
    personaje_id: string
    rol_negocio: string
    salario: number
    activo: boolean
    personajes?: Personaje
}

export interface NegocioStock {
    id: string
    negocio_id: string
    item_nombre: string
    cantidad: number
    precio_compra: number
    precio_venta: number
}

export interface Licencia {
    id: string
    personaje_id: string
    servidor_id: string
    tipo: string
    estado: 'activa' | 'suspendida' | 'revocada'
    fecha_expedicion?: string
    fecha_expiracion?: string
    expedido_por?: string
    motivo_suspension?: string
}

// Tablas MDT
export interface Ciudadano {
    id: string
    servidor_id: string
    nombre: string
    dni?: string
    telefono?: string
    direccion?: string
    notas?: string
    oficial_registro?: string
    created_at: string
}

export interface Vehiculo {
    id: string
    servidor_id: string
    matricula: string
    marca?: string
    modelo?: string
    color?: string
    propietario_nombre?: string
    estado: 'Normal' | 'Buscado' | 'Robado'
    notas?: string
    oficial_registro?: string
    created_at: string
}

export interface Multa {
    id: string
    servidor_id: string
    ciudadano_nombre: string
    importe: number
    motivo: string
    oficial_nombre?: string
    oficial_id?: string
    estado: 'pendiente' | 'pagada' | 'anulada'
    created_at: string
}

export interface Arresto {
    id: string
    servidor_id: string
    ciudadano_nombre: string
    tiempo: number
    fianza: number
    cargos: string
    oficial_nombre?: string
    oficial_id?: string
    estado: string
    created_at: string
}

export interface Llamada {
    id: string
    servidor_id: string
    tipo: string
    ubicacion: string
    descripcion?: string
    prioridad: 'baja' | 'normal' | 'alta' | 'critica'
    estado: string
    creado_por?: string
    asignado_a?: string
    created_at: string
}

export interface Bolo {
    id: string
    servidor_id: string
    titulo: string
    tipo: string
    descripcion: string
    destinatarios: 'policia' | 'ciudadanos' | 'todos'
    activo: boolean
    estado: string
    creado_por?: string
    created_at: string
}

export interface Denuncia {
    id: string
    servidor_id: string
    victima: string
    acusado?: string
    narracion: string
    estado: string
    oficial_receptor?: string
    created_at: string
}

export interface Investigacion {
    id: string
    servidor_id: string
    titulo: string
    descripcion?: string
    estado: string
    detective_lider?: string
    investigador_id?: string
    evidencias: any[]
    created_at: string
}

export interface Servicio {
    id: string
    usuario_id: string
    servidor_id: string
    tipo: 'policia' | 'ems' | 'negocio' | 'general'
    negocio_id?: string
    hora_inicio: string
    hora_fin?: string
    estado: 'disponible' | 'ocupado' | 'descanso' | 'offline'
    usuarios?: Usuario
}

export interface Auditoria {
    id: string
    servidor_id: string
    usuario_id?: string
    usuario_nombre?: string
    accion: string
    modulo: string
    descripcion?: string
    detalles?: string
    fecha_hora: string
}

export interface Sancion {
    id: string
    servidor_id: string
    usuario_sancionado_id?: string
    usuario_sancionado_nombre?: string
    tipo: 'warning' | 'ban' | 'mute'
    motivo: string
    duracion_horas?: number
    activa: boolean
    emitido_por?: string
    emitido_por_id?: string
    created_at: string
    expira_at?: string
}
